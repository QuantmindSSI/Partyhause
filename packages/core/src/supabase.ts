import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

export type CoreSupabaseClient = ReturnType<typeof createClient>;

export const initSupabaseClient = (
  url: string,
  key: string,
  options: SupabaseClientOptions<any> = {}
) => {
  if (!url || !key) {
    throw new Error("Supabase URL and key must be provided");
  }

  const mergedOptions: SupabaseClientOptions<any> = {
    ...options,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      ...(options.auth ?? {})
    }
  };

  return createClient(url, key, mergedOptions);
};
