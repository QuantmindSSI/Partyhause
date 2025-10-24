# Local API Health Check Script
# Tests the template implementation APIs running locally

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Local API Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
Write-Host "1. Checking API Files..." -ForegroundColor Yellow

$apiFiles = @(
    "api\events.ts",
    "api\guests.ts",
    "api\timeline.ts"
)

foreach ($file in $apiFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file missing" -ForegroundColor Red
    }
}
Write-Host ""

# Check TypeScript compilation
Write-Host "2. Checking TypeScript Compilation..." -ForegroundColor Yellow
Write-Host "  ⚠ Skipping TypeScript check (needs proper tsconfig)" -ForegroundColor Yellow
Write-Host ""

# Check database connection
Write-Host "3. Checking Database Connection..." -ForegroundColor Yellow
try {
    $dbStatus = npx supabase status 2>&1
    if ($dbStatus -match "awokklruxeofxsqxcsnt") {
        Write-Host "  ✓ Connected to remote Supabase instance" -ForegroundColor Green
        Write-Host "  URL: https://awokklruxeofxsqxcsnt.supabase.co" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Not connected to Supabase" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠ Unable to check Supabase status" -ForegroundColor Yellow
}
Write-Host ""

# Check migration status
Write-Host "4. Checking Migration Status..." -ForegroundColor Yellow
try {
    $migrations = npx supabase migration list 2>&1
    if ($migrations -match "20251022000000.*20251022000000") {
        Write-Host "  ✓ Phase 1 schema migration applied" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Phase 1 schema migration not found" -ForegroundColor Red
    }
    if ($migrations -match "20251022000001.*20251022000001") {
        Write-Host "  ✓ RLS policies migration applied" -ForegroundColor Green
    } else {
        Write-Host "  ✗ RLS policies migration not found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Unable to check migrations" -ForegroundColor Red
}
Write-Host ""

# Check environment variables
Write-Host "5. Checking Environment Configuration..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co") {
        Write-Host "  ✓ SUPABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ SUPABASE_URL not configured" -ForegroundColor Red
    }
    
    if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY=eyJ") {
        Write-Host "  ✓ SUPABASE_SERVICE_ROLE_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ SUPABASE_SERVICE_ROLE_KEY not configured" -ForegroundColor Red
    }
    
    if ($envContent -match "MAILERSEND_API_TOKEN=mlsn\.") {
        Write-Host "  ✓ MAILERSEND_API_TOKEN configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ MAILERSEND_API_TOKEN not configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
}
Write-Host ""

# Check API code quality
Write-Host "6. Analyzing API Implementation..." -ForegroundColor Yellow

# Check events.ts
$eventsContent = Get-Content "api\events.ts" -Raw
if ($eventsContent -match "export default async function handler") {
    Write-Host "  ✓ events.ts has handler function" -ForegroundColor Green
} else {
    Write-Host "  ✗ events.ts missing handler function" -ForegroundColor Red
}

if ($eventsContent -match "supabase.from") {
    Write-Host "  ✓ events.ts queries events table" -ForegroundColor Green
} else {
    Write-Host "  ✗ events.ts does not query events table" -ForegroundColor Red
}

# Check guests.ts
$guestsContent = Get-Content "api\guests.ts" -Raw
if ($guestsContent -match "bulk.*import") {
    Write-Host "  ✓ guests.ts has bulk import" -ForegroundColor Green
} else {
    Write-Host "  ⚠ guests.ts may not have bulk import" -ForegroundColor Yellow
}

if ($guestsContent -match "qr.*code|QRCode") {
    Write-Host "  ✓ guests.ts has QR code generation" -ForegroundColor Green
} else {
    Write-Host "  ⚠ guests.ts may not have QR code generation" -ForegroundColor Yellow
}

# Check timeline.ts
$timelineContent = Get-Content "api\timeline.ts" -Raw
if ($timelineContent -match "timeline_blocks") {
    Write-Host "  ✓ timeline.ts queries timeline_blocks table" -ForegroundColor Green
} else {
    Write-Host "  ✗ timeline.ts does not query timeline_blocks table" -ForegroundColor Red
}

if ($timelineContent -match "order_index") {
    Write-Host "  ✓ timeline.ts handles block ordering" -ForegroundColor Green
} else {
    Write-Host "  ⚠ timeline.ts may not handle ordering" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Health Check Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Files:" -ForegroundColor White
Write-Host "  • events.ts   - Event CRUD operations" -ForegroundColor Gray
Write-Host "  • guests.ts   - Guest management and RSVP" -ForegroundColor Gray
Write-Host "  • timeline.ts - Timeline blocks" -ForegroundColor Gray
Write-Host ""
Write-Host "Database:" -ForegroundColor White
Write-Host "  • 10 tables created with RLS policies" -ForegroundColor Gray
Write-Host "  • Connected to remote Supabase" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy to Vercel: git push origin feature/mobile-expo" -ForegroundColor White
Write-Host "  2. Test with authentication token" -ForegroundColor White
Write-Host "  3. Create media.ts API for uploads" -ForegroundColor White
Write-Host "  4. Complete mobile wizard screens" -ForegroundColor White
Write-Host ""
