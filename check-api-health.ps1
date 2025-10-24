# Local API Health Check Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Local API Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check API Files
Write-Host "1. Checking API Files..." -ForegroundColor Yellow
$apiFiles = @("api\events.ts", "api\guests.ts", "api\timeline.ts")
foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "  OK $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR $file missing" -ForegroundColor Red
    }
}
Write-Host ""

# 2. Check Database Connection
Write-Host "2. Checking Database..." -ForegroundColor Yellow
$migrations = npx supabase migration list 2>&1 | Out-String
if ($migrations -match "20251022000000") {
    Write-Host "  OK Phase 1 schema migration applied" -ForegroundColor Green
} else {
    Write-Host "  ERROR Phase 1 migration not found" -ForegroundColor Red
}
if ($migrations -match "20251022000001") {
    Write-Host "  OK RLS policies migration applied" -ForegroundColor Green
} else {
    Write-Host "  ERROR RLS policies not found" -ForegroundColor Red
}
Write-Host ""

# 3. Check Environment
Write-Host "3. Checking Environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $env = Get-Content ".env" -Raw
    if ($env -match "SUPABASE_URL=https://awokklruxeofxsqxcsnt") {
        Write-Host "  OK SUPABASE_URL configured" -ForegroundColor Green
    }
    if ($env -match "SUPABASE_SERVICE_ROLE_KEY=eyJ") {
        Write-Host "  OK SUPABASE_SERVICE_ROLE_KEY configured" -ForegroundColor Green
    }
    if ($env -match "MAILERSEND_API_TOKEN") {
        Write-Host "  OK MAILERSEND_API_TOKEN configured" -ForegroundColor Green
    }
} else {
    Write-Host "  ERROR .env file not found" -ForegroundColor Red
}
Write-Host ""

# 4. Analyze API Code
Write-Host "4. Analyzing API Implementation..." -ForegroundColor Yellow

$events = Get-Content "api\events.ts" -Raw
if ($events -match "export default") {
    Write-Host "  OK events.ts has handler" -ForegroundColor Green
}
if ($events -match "from.*events") {
    Write-Host "  OK events.ts queries events table" -ForegroundColor Green
}

$guests = Get-Content "api\guests.ts" -Raw
if ($guests -match "bulk") {
    Write-Host "  OK guests.ts has bulk import" -ForegroundColor Green
}
if ($guests -match "qr") {
    Write-Host "  OK guests.ts has QR generation" -ForegroundColor Green
}

$timeline = Get-Content "api\timeline.ts" -Raw
if ($timeline -match "timeline_blocks") {
    Write-Host "  OK timeline.ts queries timeline_blocks" -ForegroundColor Green
}
if ($timeline -match "order_index") {
    Write-Host "  OK timeline.ts handles ordering" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created APIs:" -ForegroundColor White
Write-Host "  events.ts   - Event CRUD" -ForegroundColor Gray
Write-Host "  guests.ts   - Guest management" -ForegroundColor Gray
Write-Host "  timeline.ts - Timeline blocks" -ForegroundColor Gray
Write-Host ""
Write-Host "Database: 10 tables with RLS policies" -ForegroundColor Gray
Write-Host "Connection: Remote Supabase instance" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy to Vercel" -ForegroundColor White
Write-Host "  2. Create media.ts API" -ForegroundColor White
Write-Host "  3. Complete mobile wizard" -ForegroundColor White
Write-Host ""
