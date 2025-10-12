declare module './env-server.js' {
  export const RESEND_API_KEY: string;
  export const RESEND_FROM_EMAIL: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_SERVICE_ROLE_KEY: string;
  export function hasAllServerEnv(): boolean;
}
