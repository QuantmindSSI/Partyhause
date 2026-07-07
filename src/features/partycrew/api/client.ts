/**
 * PartyCrew API Client for Web
 * Handles all API requests to the backend API (Azure Container Apps / serverless functions)
 */

import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/apiBase';

// Get API base URL from the centralized helper (single source of truth: VITE_API_URL)
const getApiUrl = (): string => getApiBaseUrl();

/**
 * Make authenticated API request
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const url = `${getApiUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

/**
 * Make unauthenticated API request (public data)
 */
export const publicApiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const api = {
  url: getApiUrl(),
  request: apiRequest,
  publicRequest: publicApiRequest,
};
