import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    // GET /api/polls?event_id=xxx - Get all polls for an event
    if (req.method === 'GET' && req.query.event_id) {
      const { event_id } = req.query;

      const { data: polls, error } = await supabase
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
        .eq('event_id', event_id)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet, return empty array instead of error
        if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return res.status(200).json({ polls: [] });
        }
        return res.status(500).json({ error: error.message });
      }

      // Transform data to match frontend types
      const transformedPolls = polls.map((poll: any) => {
        const optionsMap = new Map();
        
        // Count votes per option
        poll.votes?.forEach((vote: any) => {
          if (!optionsMap.has(vote.option_id)) {
            optionsMap.set(vote.option_id, {
              votes: 0,
              voters: []
            });
          }
          const opt = optionsMap.get(vote.option_id);
          if (!opt.voters.includes(vote.user_id)) {
            opt.votes++;
            opt.voters.push(vote.user_id);
          }
        });

        // Transform options
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

        return {
          id: poll.id,
          event_id: poll.event_id,
          node_id: poll.node_id,
          created_by: poll.created_by,
          creator_name: poll.creator?.[0]?.display_name || poll.creator?.[0]?.username || 'Unknown',
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
      });

      return res.status(200).json({ polls: transformedPolls });
    }

    // POST /api/polls - Create a new poll
    if (req.method === 'POST') {
      const { event_id, question, poll_type, options, ends_at, auto_close_on_consensus, consensus_threshold } = req.body;

      if (!event_id || !question || !poll_type || !options || options.length < 2) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          event_id,
          created_by: user.id,
          question,
          poll_type,
          ends_at: ends_at || null,
          auto_close_on_consensus: auto_close_on_consensus || false,
          consensus_threshold: consensus_threshold || 70,
          status: 'active'
        })
        .select()
        .single();

      if (pollError) {
        // If table doesn't exist, return helpful error
        if (pollError.message.includes('relation') || pollError.message.includes('does not exist')) {
          return res.status(503).json({ 
            error: 'Polls feature is not yet enabled. Please run database migration.',
            details: pollError.message 
          });
        }
        return res.status(500).json({ error: pollError.message });
      }

      // Create options
      const optionsData = options.map((opt: any) => ({
        poll_id: poll.id,
        text: opt.text,
        description: opt.description || null
      }));

      const { data: createdOptions, error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData)
        .select();

      if (optionsError) {
        return res.status(500).json({ error: optionsError.message });
      }

      // Get creator name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      // Return formatted poll
      const formattedPoll = {
        ...poll,
        creator_name: profile?.display_name || profile?.username || 'Unknown',
        options: createdOptions.map(opt => ({
          id: opt.id,
          text: opt.text,
          description: opt.description,
          votes: 0,
          voters: [],
          user_has_voted: false
        })),
        total_votes: 0,
        total_voters: 0
      };

      return res.status(201).json({ poll: formattedPoll });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Polls API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
