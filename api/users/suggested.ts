/**
 * Suggested Creators API
 * GET /api/users/suggested?limit=10
 * Returns personalized creator suggestions based on mutual connections, interests, location
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SuggestedCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  account_type: string;
  
  // Stats
  partycrew_count: number;
  events_hosted: number;
  haus_score: number;
  
  // Why suggested
  reason: string;
  mutual_crew_count?: number;
  shared_interests?: string[];
  same_location?: boolean;
}

interface SuggestionsResponse {
  suggestions: SuggestedCreator[];
  total: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const limit = Math.min(parseInt(req.query.limit as string || '10'), 50);

    // Get user's profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('location')
      .eq('id', user.id)
      .single();

    // Get users already following
    const { data: following } = await supabase
      .from('connections')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map(f => f.following_id) || [];
    const excludeIds = [...followingIds, user.id];

    // STRATEGY 1: Users with mutual connections
    const { data: mutualCrewSuggestions } = await supabase
      .from('connections')
      .select(`
        following_id,
        user_profiles!connections_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_verified,
          account_type,
          partycrew_count,
          events_hosted,
          haus_score,
          location,
          is_private
        )
      `)
      .in('follower_id', followingIds)
      .not('following_id', 'in', `(${excludeIds.join(',')})`)
      .limit(20);

    // Count mutual connections for each suggestion
    const mutualSuggestions: SuggestedCreator[] = [];
    
    if (mutualCrewSuggestions) {
      const uniqueProfiles = new Map();
      
      for (const conn of mutualCrewSuggestions) {
        const profile = conn.user_profiles as any;
        if (!profile || profile.is_private) continue;
        
        if (!uniqueProfiles.has(profile.id)) {
          // Count mutual connections
          const { data: mutualCount } = await supabase
            .rpc('get_mutual_crew_count', { user1: user.id, user2: profile.id });

          uniqueProfiles.set(profile.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_verified: profile.is_verified,
            account_type: profile.account_type,
            partycrew_count: profile.partycrew_count,
            events_hosted: profile.events_hosted,
            haus_score: profile.haus_score,
            reason: `${mutualCount} mutual PartyCrew member${mutualCount === 1 ? '' : 's'}`,
            mutual_crew_count: mutualCount || 0,
            same_location: userProfile?.location === profile.location && !!profile.location
          });
        }
      }
      
      mutualSuggestions.push(...Array.from(uniqueProfiles.values()));
    }

    // Sort by mutual count
    mutualSuggestions.sort((a, b) => (b.mutual_crew_count || 0) - (a.mutual_crew_count || 0));

    // STRATEGY 2: Popular creators in same location
    const locationSuggestions: SuggestedCreator[] = [];
    
    if (userProfile?.location && mutualSuggestions.length < limit) {
      const { data: locationCreators } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('location', userProfile.location)
        .not('id', 'in', `(${[...excludeIds, ...mutualSuggestions.map(s => s.id)].join(',')})`)
        .eq('is_private', false)
        .gte('events_hosted', 1)
        .order('partycrew_count', { ascending: false })
        .limit(10);

      if (locationCreators) {
        for (const profile of locationCreators) {
          locationSuggestions.push({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_verified: profile.is_verified,
            account_type: profile.account_type,
            partycrew_count: profile.partycrew_count,
            events_hosted: profile.events_hosted,
            haus_score: profile.haus_score,
            reason: `Popular in ${userProfile.location}`,
            same_location: true
          });
        }
      }
    }

    // STRATEGY 3: Verified creators with high engagement
    const verifiedSuggestions: SuggestedCreator[] = [];
    
    if (mutualSuggestions.length + locationSuggestions.length < limit) {
      const alreadySuggestedIds = [
        ...excludeIds, 
        ...mutualSuggestions.map(s => s.id),
        ...locationSuggestions.map(s => s.id)
      ];

      const { data: verifiedCreators } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_verified', true)
        .not('id', 'in', `(${alreadySuggestedIds.join(',')})`)
        .eq('is_private', false)
        .gte('events_hosted', 3)
        .order('haus_score', { ascending: false })
        .limit(10);

      if (verifiedCreators) {
        for (const profile of verifiedCreators) {
          verifiedSuggestions.push({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_verified: profile.is_verified,
            account_type: profile.account_type,
            partycrew_count: profile.partycrew_count,
            events_hosted: profile.events_hosted,
            haus_score: profile.haus_score,
            reason: 'Verified creator'
          });
        }
      }
    }

    // Combine and limit suggestions
    const allSuggestions = [
      ...mutualSuggestions,
      ...locationSuggestions,
      ...verifiedSuggestions
    ].slice(0, limit);

    const response: SuggestionsResponse = {
      suggestions: allSuggestions,
      total: allSuggestions.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Suggested Creators Error]:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
