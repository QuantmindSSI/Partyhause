// Server-side environment helper: prefer runtime server envs but fall back to VITE_ prefixed
// variables (useful when Vercel injects VITE_ names during build).
export const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export function hasAllServerEnv() {
  return !!(RESEND_API_KEY && RESEND_FROM_EMAIL && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
