# Supabase CLI setup & migrations

This document describes how to install the Supabase CLI, link it to your Supabase project, and apply the repository migrations stored in `supabase/migrations/`.

Prerequisites
- Node 18+, npm
- supabase account and project
- GitHub repo already connected to Vercel (optional)

Install Supabase CLI (PowerShell)
```powershell
# via npm (recommended for Windows PowerShell)
npm install -g supabase

# or via Homebrew on macOS/Linux
# brew install supabase/tap/supabase
```

Login and link
```powershell
# login (interactive: opens browser and authorizes CLI)
supabase login

# link this directory to your project (replace <PROJECT_REF> with your supabase project ref)
supabase link --project-ref <PROJECT_REF>
```

Apply migrations
```powershell
# run migrations (this will apply migrations found in supabase/migrations/)
supabase db push --dir supabase/migrations

# Alternatively run:
supabase db reset --skip_db_setup --migrations-dir supabase/migrations
# (careful: reset may drop and recreate the DB depending on flags)
```

Verify
- Use the Supabase UI or `psql` to verify the `email_logs` table has `template_id` and `template_body`.
- Run the repo smoke-test locally:

```powershell
$env:SUPABASE_URL = "https://xyz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
npm run smoke-test:migration
```

Notes & security
- Never commit service role keys. Use environment variables or GitHub Secrets for CI.
- If RLS is enabled, use the service role key for migration steps.