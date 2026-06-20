import { Platform } from "react-native";
import Constants from "expo-constants";
import { initSupabaseClient, type CoreSupabaseClient } from "@partyhause/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "./storage";

const expoPublic = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const SUPABASE_URL = expoPublic?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = expoPublic?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasSupabaseConfig && typeof window !== 'undefined') {
	console.warn(
		"Supabase credentials are missing. Provide EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env or your shell before starting Expo."
	);
}

// Lazy initialization to avoid SSR issues
let _supabase: CoreSupabaseClient | null = null;

export const getSupabase = (): CoreSupabaseClient | null => {
	// Skip initialization only during web SSR/static rendering
	// On native (iOS/Android), window is undefined but we still need to initialize
	if (Platform.OS === 'web' && typeof window === 'undefined') {
		return null;
	}
	
	if (_supabase) {
		return _supabase;
	}
	
	if (!hasSupabaseConfig) {
		return null;
	}
	
	// Use AsyncStorage directly on native, localStorage-based storage on web
	const getStorage = () => {
		if (Platform.OS === 'web') {
			return storage;
		}
		return AsyncStorage;
	};
	
	_supabase = initSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
		global: {
			fetch: fetch.bind(globalThis),
		},
		auth: {
			storage: getStorage(),
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
		}
	});
	
	return _supabase;
};

// For backwards compatibility
export const supabase = (Platform.OS !== 'web' || typeof window !== 'undefined') ? getSupabase() : null;

export const requireSupabase = (): CoreSupabaseClient => {
	const client = getSupabase();
	if (!client) {
		throw new Error(
			"Supabase credentials are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
		);
	}
	return client;
};
