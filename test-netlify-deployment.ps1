# Test which endpoints are deployed on Netlify
$base = "https://partyhause.netlify.app"
$endpoints = @(
    "/api/health",
    "/api/guests",
    "/api/events", 
    "/api/timeline",
    "/api/polls",
    "/api/poll-actions",
    "/api/templates",
    "/api/event-templates",
    "/api/create-event-from-template",
    "/api/email",
    "/api/send-email",
    "/api/partycrew/toggle",
    "/api/partycrew/members",
    "/api/partycrew/crewing-with",
    "/api/partycrew/requests",
    "/api/users/suggested",
    "/api/feed/crew",
    "/api/generate-invite",
    "/api/join-event",
    "/api/convert-guest-to-crew",
    "/api/cost-split",
    "/api/user-connections"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   NETLIFY DEPLOYMENT STATUS CHECK" -ForegroundColor Cyan
Write-Host "   Site: $base" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$deployed = 0
$notDeployed = 0
$deployedList = @()
$notDeployedList = @()

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$base$endpoint" -Method GET -TimeoutSec 5 -ErrorAction Stop
        $content = $response.Content
        
        if ($content -like "*<!doctype html>*" -or $content -like "*<html*") {
            Write-Host "  X $endpoint (404 - Returns HTML)" -ForegroundColor Red
            $notDeployed++
            $notDeployedList += $endpoint
        } else {
            Write-Host "  OK $endpoint (200)" -ForegroundColor Green
            $deployed++
            $deployedList += $endpoint
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "  OK $endpoint (401 - Auth required)" -ForegroundColor Green
            $deployed++
            $deployedList += $endpoint
        } elseif ($statusCode -eq 404) {
            Write-Host "  X $endpoint (404 - Not found)" -ForegroundColor Red
            $notDeployed++
            $notDeployedList += $endpoint
        } else {
            Write-Host "  ? $endpoint ($statusCode)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployed:     $deployed / $($endpoints.Count)" -ForegroundColor Green
Write-Host "  Not Deployed: $notDeployed / $($endpoints.Count)" -ForegroundColor Red
Write-Host "  Coverage:     $([math]::Round($deployed / $endpoints.Count * 100, 1))%" -ForegroundColor Cyan
Write-Host "`n========================================`n" -ForegroundColor Cyan

if ($notDeployedList.Count -gt 0) {
    Write-Host "Endpoints NOT Deployed:" -ForegroundColor Red
    $notDeployedList | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
}
