# Quick Deployment Script
# Run this after you've configured environment variables in Vercel Dashboard

Write-Host "PartyHause Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Step 1: Checking Vercel login..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not logged in to Vercel. Running login..." -ForegroundColor Red
    vercel login
} else {
    Write-Host "[OK] Logged in as: $loginCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Building project locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Running TypeScript checks..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] TypeScript errors found. Continue anyway? (y/n)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "y") {
        Write-Host "[ERROR] Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 4: Checking environment variables..." -ForegroundColor Yellow
Write-Host "Make sure you've configured these in Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "  - SUPABASE_URL" -ForegroundColor White
Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor White
Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "  - MAILERSEND_API_TOKEN" -ForegroundColor White
Write-Host "  - MAILERSEND_FROM_EMAIL" -ForegroundColor White
Write-Host ""
Write-Host "Have you configured all environment variables? (y/n)" -ForegroundColor Yellow
$envReady = Read-Host
if ($envReady -ne "y") {
    Write-Host "[ERROR] Please configure environment variables first:" -ForegroundColor Red
    Write-Host "   https://vercel.com/dashboard > Your Project > Settings > Environment Variables" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Step 5: Deploying to production..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test web app at your deployment URL" -ForegroundColor White
    Write-Host "2. Update mobile app .env with production URL" -ForegroundColor White
    Write-Host "3. Add Vercel URL to Supabase allowed origins" -ForegroundColor White
    Write-Host "4. Update MailerSend webhook URL" -ForegroundColor White
    Write-Host ""
    Write-Host "See VERCEL_DEPLOYMENT_PLAN.md for detailed post-deployment steps" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed. Check logs above for errors." -ForegroundColor Red
    Write-Host "Tip: Try running 'vercel logs --follow' to see real-time logs" -ForegroundColor Yellow
}
