# Monitor Netlify Deployment Progress
$base = "https://partyhause.netlify.app"
$criticalEndpoints = @("/api/guests", "/api/timeline")

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   MONITORING NETLIFY DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host "This typically takes 2-5 minutes.`n" -ForegroundColor Yellow

$maxAttempts = 20
$attempt = 0
$deployed = $false

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - Checking endpoints..." -ForegroundColor Gray
    
    $guestsDeployed = $false
    $timelineDeployed = $false
    
    # Check /api/guests
    try {
        $response = Invoke-WebRequest -Uri "$base/api/guests" -Method GET -TimeoutSec 5 -ErrorAction Stop
        $content = $response.Content
        if ($content -notlike "*<!doctype html>*") {
            $guestsDeployed = $true
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            $guestsDeployed = $true
        }
    }
    
    # Check /api/timeline
    try {
        $response = Invoke-WebRequest -Uri "$base/api/timeline" -Method GET -TimeoutSec 5 -ErrorAction Stop
        $content = $response.Content
        if ($content -notlike "*<!doctype html>*") {
            $timelineDeployed = $true
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            $timelineDeployed = $true
        }
    }
    
    if ($guestsDeployed -and $timelineDeployed) {
        $deployed = $true
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "   DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        Write-Host "Critical endpoints are now live:" -ForegroundColor Green
        Write-Host "  - /api/guests (401 - Auth required)" -ForegroundColor Green
        Write-Host "  - /api/timeline (401 - Auth required)" -ForegroundColor Green
        Write-Host "`nRunning full endpoint test...`n" -ForegroundColor Cyan
        & ".\test-netlify-deployment.ps1"
        break
    } else {
        Write-Host "  Still deploying... (guests: $guestsDeployed, timeline: $timelineDeployed)" -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    }
}

if (-not $deployed) {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "   DEPLOYMENT TIMEOUT" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Deployment is taking longer than expected." -ForegroundColor Yellow
    Write-Host "Please check: https://app.netlify.com/sites/partyhause/deploys`n" -ForegroundColor White
}
