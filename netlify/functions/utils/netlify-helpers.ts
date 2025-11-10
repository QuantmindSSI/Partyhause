/**
 * Netlify Functions Helpers
 * Utilities for Netlify serverless functions
 */

import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

/**
 * Get authenticated user from Authorization header
 */
export const getUserFromAuth = async (event: HandlerEvent) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (error) {
    console.warn('Auth lookup failed', error);
    return null;
  }
};

/**
 * Create Supabase client with user auth
 */
export const createAuthenticatedSupabase = (event: HandlerEvent) => {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: event.headers.authorization || event.headers.Authorization || '',
        },
      },
    }
  );
};

/**
 * Standard CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Handle CORS preflight requests
 */
export const handleCORS = (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }
  return null;
};

/**
 * Parse request body
 */
export const parseBody = (event: HandlerEvent) => {
  if (!event.body) return null;
  
  try {
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64').toString() 
      : event.body;
    return JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse body:', error);
    return null;
  }
};

/**
 * Create success response
 */
export const successResponse = (data: any, statusCode = 200) => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
};

/**
 * Create error response
 */
export const errorResponse = (error: string, statusCode = 400, details?: any) => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error, ...(details && { details }) }),
  };
};

/**
 * Require authentication
 */
export const requireAuth = async (event: HandlerEvent) => {
  const user = await getUserFromAuth(event);
  if (!user) {
    return {
      error: errorResponse('Unauthorized', 401),
      user: null,
    };
  }
  return { error: null, user };
};
