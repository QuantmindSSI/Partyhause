// Server-side environment helper (plain JS) - prefer runtime server envs, fallback to VITE_ prefixed vars
export const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN || '';
export const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export function hasAllServerEnv() {
  return !!(MAILERSEND_API_TOKEN && MAILERSEND_FROM_EMAIL && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
