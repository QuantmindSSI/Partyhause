<#
Supabase setup helper (PowerShell)
Run this after installing supabase CLI and logging in via `supabase login`.

Example usage:
.
  .\scripts\supabase-setup.ps1 -ProjectRef "your-project-ref" -ApplyMigrations

#>

param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectRef,

  [switch]$ApplyMigrations
)

Write-Host "Linking directory to Supabase project: $ProjectRef"
supabase link --project-ref $ProjectRef

if ($ApplyMigrations) {
  Write-Host "Applying migrations from supabase/migrations..."
  supabase db push --dir supabase/migrations
  if ($LASTEXITCODE -ne 0) { Write-Error "Migrations failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
  Write-Host "Migrations applied"
} else {
  Write-Host "Skipping migrations. Re-run with -ApplyMigrations to apply them."
}
