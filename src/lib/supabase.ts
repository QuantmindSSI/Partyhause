import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Lazy-init: don't throw at module load if creds are missing. This lets the
// PWA shell load (landing page, static content) even when Supabase isn't
// configured. Auth/data features will surface a user-facing error instead
// of crashing the entire app with a blank screen.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, ' +
      'or wait for the Azure migration to complete.'
    );
  }
  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Proxy that lazily creates the client on first property access.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
}) as SupabaseClient;

// Type definitions for our database tables
export type Tables = {
  events: {
    id: string;
    host_id: string;
    name: string;
    event_date: string;
    location: string;
    spotify_playlist_url: string;
    active_game_id: string | null;
    created_at: string;
  };
  guests: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    is_checked_in: boolean;
    created_at: string;
  };
  games: {
    id: string;
    event_id: string;
    type: string;
    settings: Record<string, unknown>;
    content: Record<string, unknown>;
    order_index: number;
    created_at: string;
  };
  game_sessions: {
    id: string;
    game_id: string;
    status: 'pending' | 'active' | 'completed';
    current_round: number;
    scores: Record<string, number>;
    created_at: string;
    updated_at: string;
  };
};
