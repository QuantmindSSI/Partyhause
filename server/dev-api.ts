import dotenv from 'dotenv';
dotenv.config();

// Enable dev bypass auth for local development
process.env.AUTH_BYPASS = process.env.AUTH_BYPASS || 'true';

// Start the production Express server (all routes use Prisma, not Supabase)
import('./index');
