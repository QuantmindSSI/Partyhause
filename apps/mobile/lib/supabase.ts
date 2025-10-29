import { Platform } from "react-native";
import Constants from "expo-constants";
import { initSupabaseClient, type CoreSupabaseClient } from "@partyhause/core";
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
	// Skip initialization during static rendering
	if (typeof window === 'undefined') {
		return null;
	}
	
	if (_supabase) {
		return _supabase;
	}
	
	if (!hasSupabaseConfig) {
		return null;
	}
	
	// Use web-compatible storage on web platform
	const getStorage = () => {
		if (Platform.OS === 'web') {
			return storage;
		}
		// For native, dynamically import AsyncStorage
		return require("@react-native-async-storage/async-storage").default;
	};
	
	_supabase = initSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
		auth: {
			storage: getStorage(),
			storageKey: "partyhause-mobile-auth"
		}
	});
	
	return _supabase;
};

// For backwards compatibility
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

export const requireSupabase = (): CoreSupabaseClient => {
	const client = getSupabase();
	if (!client) {
		throw new Error(
			"Supabase credentials are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
		);
	}
	return client;
};
