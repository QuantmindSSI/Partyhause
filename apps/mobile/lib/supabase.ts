import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { initSupabaseClient, type CoreSupabaseClient } from "@partyhause/core";

const expoPublic = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const SUPABASE_URL = expoPublic?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = expoPublic?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasSupabaseConfig) {
	console.warn(
		"Supabase credentials are missing. Provide EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env or your shell before starting Expo."
	);
}

export const supabase: CoreSupabaseClient | null = hasSupabaseConfig
	? initSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
			auth: {
				storage: AsyncStorage,
				storageKey: "partyhause-mobile-auth"
			}
		})
	: null;

export const requireSupabase = (): CoreSupabaseClient => {
	if (!supabase) {
		throw new Error(
			"Supabase credentials are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
		);
	}

	return supabase;
};
