import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pollId = req.query.pollId as string;
    const action = req.query.action as string;

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    // GET /api/poll-actions?pollId=xxx - Get single poll details
    if (req.method === 'GET') {
      const { data: poll, error } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          votes:poll_votes(
            id,
            user_id,
            option_id,
            voted_at
          ),
          creator:user_profiles!polls_created_by_fkey(
            display_name,
            username
          )
        `)
        .eq('id', pollId)
        .single();

      if (error) {
        // If table doesn't exist yet, return helpful error
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          return res.status(503).json({ 
            error: 'Polls feature is not yet enabled. Please run database migration.' 
          });
        }
        return res.status(500).json({ error: error.message });
      }

      // Transform data
      const optionsMap = new Map();
      poll.votes?.forEach((vote: any) => {
        if (!optionsMap.has(vote.option_id)) {
          optionsMap.set(vote.option_id, { votes: 0, voters: [] });
        }
        const opt = optionsMap.get(vote.option_id);
        if (!opt.voters.includes(vote.user_id)) {
          opt.votes++;
          opt.voters.push(vote.user_id);
        }
      });

      const options = poll.options?.map((opt: any) => {
        const voteData = optionsMap.get(opt.id) || { votes: 0, voters: [] };
        return {
          id: opt.id,
          text: opt.text,
          description: opt.description,
          votes: voteData.votes,
          voters: voteData.voters,
          user_has_voted: voteData.voters.includes(user.id)
        };
      }) || [];

      const uniqueVoters = new Set(poll.votes?.map((v: any) => v.user_id) || []);

      const transformedPoll = {
        id: poll.id,
        event_id: poll.event_id,
        node_id: poll.node_id,
        created_by: poll.created_by,
        creator_name: poll.creator?.display_name || poll.creator?.username || 'Unknown',
        question: poll.question,
        poll_type: poll.poll_type,
        options,
        ends_at: poll.ends_at,
        auto_close_on_consensus: poll.auto_close_on_consensus,
        consensus_threshold: poll.consensus_threshold,
        status: poll.status,
        total_votes: poll.votes?.length || 0,
        total_voters: uniqueVoters.size,
        created_at: poll.created_at,
        closed_at: poll.closed_at
      };

      return res.status(200).json({ poll: transformedPoll });
    }

    // POST /api/poll-actions?pollId=xxx&action=vote - Vote on a poll
    if (req.method === 'POST' && action === 'vote') {
      const { option_ids } = req.body;

      if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
        return res.status(400).json({ error: 'option_ids array is required' });
      }

      // Get poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*, options:poll_options(*)')
        .eq('id', pollId)
        .single();

      if (pollError || !poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      if (poll.status !== 'active') {
        return res.status(400).json({ error: 'Poll is not active' });
      }

      // Remove existing votes by this user
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', user.id);

      // Insert new votes
      const votes = option_ids.map(optionId => ({
        poll_id: pollId,
        user_id: user.id,
        option_id: optionId
      }));

      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert(votes);

      if (voteError) {
        return res.status(500).json({ error: voteError.message });
      }

      // Check for consensus if auto-close is enabled
      if (poll.auto_close_on_consensus) {
        const { data: allVotes } = await supabase
          .from('poll_votes')
          .select('option_id, user_id')
          .eq('poll_id', pollId);

        if (allVotes) {
          const uniqueVoters = new Set(allVotes.map(v => v.user_id)).size;
          const optionCounts = new Map();
          
          allVotes.forEach(vote => {
            optionCounts.set(vote.option_id, (optionCounts.get(vote.option_id) || 0) + 1);
          });

          const maxVotes = Math.max(...Array.from(optionCounts.values()));
          const percentage = uniqueVoters > 0 ? (maxVotes / uniqueVoters) * 100 : 0;

          if (percentage >= poll.consensus_threshold) {
            await supabase
              .from('polls')
              .update({ status: 'consensus-reached', closed_at: new Date().toISOString() })
              .eq('id', pollId);
          }
        }
      }

      // Fetch updated poll
      const { data: updatedPoll } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          votes:poll_votes(id, user_id, option_id, voted_at),
          creator:user_profiles!polls_created_by_fkey(display_name, username)
        `)
        .eq('id', pollId)
        .single();

      // Transform and return
      const optionsMap = new Map();
      updatedPoll.votes?.forEach((vote: any) => {
        if (!optionsMap.has(vote.option_id)) {
          optionsMap.set(vote.option_id, { votes: 0, voters: [] });
        }
        const opt = optionsMap.get(vote.option_id);
        if (!opt.voters.includes(vote.user_id)) {
          opt.votes++;
          opt.voters.push(vote.user_id);
        }
      });

      const options = updatedPoll.options?.map((opt: any) => {
        const voteData = optionsMap.get(opt.id) || { votes: 0, voters: [] };
        return {
          id: opt.id,
          text: opt.text,
          description: opt.description,
          votes: voteData.votes,
          voters: voteData.voters,
          user_has_voted: voteData.voters.includes(user.id)
        };
      }) || [];

      const uniqueVoters = new Set(updatedPoll.votes?.map((v: any) => v.user_id) || []);

      const transformedPoll = {
        id: updatedPoll.id,
        event_id: updatedPoll.event_id,
        node_id: updatedPoll.node_id,
        created_by: updatedPoll.created_by,
        creator_name: updatedPoll.creator?.display_name || updatedPoll.creator?.username || 'Unknown',
        question: updatedPoll.question,
        poll_type: updatedPoll.poll_type,
        options,
        ends_at: updatedPoll.ends_at,
        auto_close_on_consensus: updatedPoll.auto_close_on_consensus,
        consensus_threshold: updatedPoll.consensus_threshold,
        status: updatedPoll.status,
        total_votes: updatedPoll.votes?.length || 0,
        total_voters: uniqueVoters.size,
        created_at: updatedPoll.created_at,
        closed_at: updatedPoll.closed_at
      };

      return res.status(200).json({ poll: transformedPoll });
    }

    // POST /api/poll-actions?pollId=xxx&action=close - Close a poll
    if (req.method === 'POST' && action === 'close') {
      // Verify user is poll creator or event host
      const { data: poll } = await supabase
        .from('polls')
        .select('*, event:events!polls_event_id_fkey(host_id)')
        .eq('id', pollId)
        .single();

      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      const isCreator = poll.created_by === user.id;
      const isHost = poll.event?.host_id === user.id;

      if (!isCreator && !isHost) {
        return res.status(403).json({ error: 'Only poll creator or event host can close polls' });
      }

      // Close the poll
      const { error } = await supabase
        .from('polls')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', pollId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Fetch and return updated poll
      const { data: updatedPoll } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          votes:poll_votes(id, user_id, option_id, voted_at),
          creator:user_profiles!polls_created_by_fkey(display_name, username)
        `)
        .eq('id', pollId)
        .single();

      const optionsMap = new Map();
      updatedPoll.votes?.forEach((vote: any) => {
        if (!optionsMap.has(vote.option_id)) {
          optionsMap.set(vote.option_id, { votes: 0, voters: [] });
        }
        const opt = optionsMap.get(vote.option_id);
        if (!opt.voters.includes(vote.user_id)) {
          opt.votes++;
          opt.voters.push(vote.user_id);
        }
      });

      const options = updatedPoll.options?.map((opt: any) => {
        const voteData = optionsMap.get(opt.id) || { votes: 0, voters: [] };
        return {
          id: opt.id,
          text: opt.text,
          description: opt.description,
          votes: voteData.votes,
          voters: voteData.voters,
          user_has_voted: voteData.voters.includes(user.id)
        };
      }) || [];

      const uniqueVoters = new Set(updatedPoll.votes?.map((v: any) => v.user_id) || []);

      const transformedPoll = {
        id: updatedPoll.id,
        event_id: updatedPoll.event_id,
        node_id: updatedPoll.node_id,
        created_by: updatedPoll.created_by,
        creator_name: updatedPoll.creator?.display_name || updatedPoll.creator?.username || 'Unknown',
        question: updatedPoll.question,
        poll_type: updatedPoll.poll_type,
        options,
        ends_at: updatedPoll.ends_at,
        auto_close_on_consensus: updatedPoll.auto_close_on_consensus,
        consensus_threshold: updatedPoll.consensus_threshold,
        status: updatedPoll.status,
        total_votes: updatedPoll.votes?.length || 0,
        total_voters: uniqueVoters.size,
        created_at: updatedPoll.created_at,
        closed_at: updatedPoll.closed_at
      };

      return res.status(200).json({ poll: transformedPoll });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Poll actions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
