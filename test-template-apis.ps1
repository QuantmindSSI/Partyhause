# Template Implementation API Testing Script (PowerShell)
# Test Events, Guests, and Timeline APIs

# Configuration
$API_BASE = "https://partyhause.vercel.app/api"
$SUPABASE_URL = "https://awokklruxeofxsqxcsnt.supabase.co"
# Replace with your actual auth token after login
$AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Template Implementation API Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. CREATE EVENT (Birthday Template)
# ============================================
Write-Host "1. Creating Birthday Event..." -ForegroundColor Yellow
$eventBody = @{
    template_type = "birthday"
    title = "Sarah's 30th Birthday Bash"
    description = "Join us for an unforgettable celebration!"
    start_date = "2025-11-15T18:00:00Z"
    end_date = "2025-11-15T23:00:00Z"
    timezone = "America/New_York"
    location_name = "The Garden Venue"
    location_address = "123 Party Lane, New York, NY 10001"
    privacy = "private"
    settings = @{
        theme = "Garden Party"
        dress_code = "Cocktail Attire"
        gift_registry = "https://registry.example.com"
    }
} | ConvertTo-Json -Depth 10

try {
    $eventResponse = Invoke-RestMethod -Uri "$API_BASE/events" -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AUTH_TOKEN"
        } `
        -Body $eventBody
    
    $eventResponse | ConvertTo-Json -Depth 10
    $EVENT_ID = if ($eventResponse.id) { $eventResponse.id } else { $eventResponse.data.id }
    Write-Host "Event ID: $EVENT_ID" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# ============================================
# 2. GET EVENT
# ============================================
if ($EVENT_ID) {
    Write-Host "2. Retrieving Event..." -ForegroundColor Yellow
    try {
        $eventData = Invoke-RestMethod -Uri "$API_BASE/events?id=$EVENT_ID" -Method Get `
            -Headers @{ "Authorization" = "Bearer $AUTH_TOKEN" }
        $eventData | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 3. UPDATE EVENT STATUS
# ============================================
if ($EVENT_ID) {
    Write-Host "3. Publishing Event..." -ForegroundColor Yellow
    $updateBody = @{
        id = $EVENT_ID
        status = "published"
    } | ConvertTo-Json
    
    try {
        $updated = Invoke-RestMethod -Uri "$API_BASE/events" -Method Patch `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $AUTH_TOKEN"
            } `
            -Body $updateBody
        $updated | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 4. BULK IMPORT GUESTS
# ============================================
if ($EVENT_ID) {
    Write-Host "4. Importing Guests..." -ForegroundColor Yellow
    $guestsBody = @{
        event_id = $EVENT_ID
        guests = @(
            @{
                name = "John Doe"
                email = "john@example.com"
                phone = "+1-555-0101"
                plus_ones = 1
            },
            @{
                name = "Jane Smith"
                email = "jane@example.com"
                phone = "+1-555-0102"
                dietary_restrictions = @("vegetarian")
            },
            @{
                name = "Bob Johnson"
                email = "bob@example.com"
                rsvp_status = "accepted"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $guests = Invoke-RestMethod -Uri "$API_BASE/guests" -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $AUTH_TOKEN"
            } `
            -Body $guestsBody
        $guests | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 5. GET GUEST LIST WITH RSVP STATS
# ============================================
if ($EVENT_ID) {
    Write-Host "5. Fetching Guest List & RSVP Stats..." -ForegroundColor Yellow
    try {
        $guestList = Invoke-RestMethod -Uri "$API_BASE/guests?event_id=$EVENT_ID&include_stats=true" -Method Get `
            -Headers @{ "Authorization" = "Bearer $AUTH_TOKEN" }
        $guestList | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 6. UPDATE GUEST RSVP
# ============================================
if ($EVENT_ID) {
    Write-Host "6. Updating Guest RSVP..." -ForegroundColor Yellow
    try {
        $guestList = Invoke-RestMethod -Uri "$API_BASE/guests?event_id=$EVENT_ID" -Method Get `
            -Headers @{ "Authorization" = "Bearer $AUTH_TOKEN" }
        
        $GUEST_ID = if ($guestList.guests -and $guestList.guests[0].id) { $guestList.guests[0].id } else { $guestList.data[0].id }
        
        if ($GUEST_ID) {
            $rsvpBody = @{
                id = $GUEST_ID
                rsvp_status = "accepted"
                dietary_restrictions = @("gluten-free", "nut-free")
            } | ConvertTo-Json -Depth 10
            
            $rsvpUpdate = Invoke-RestMethod -Uri "$API_BASE/guests" -Method Patch `
                -Headers @{
                    "Content-Type" = "application/json"
                    "Authorization" = "Bearer $AUTH_TOKEN"
                } `
                -Body $rsvpBody
            $rsvpUpdate | ConvertTo-Json -Depth 10
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 7. CREATE TIMELINE BLOCKS
# ============================================
if ($EVENT_ID) {
    Write-Host "7. Creating Timeline Blocks..." -ForegroundColor Yellow
    $timelineBody = @{
        event_id = $EVENT_ID
        blocks = @(
            @{
                label = "Guest Arrival & Cocktails"
                description = "Welcome drinks and mingling"
                start_time = "2025-11-15T18:00:00Z"
                duration = 60
                type = "activity"
                guest_visible = $true
                notify_before = 30
            },
            @{
                label = "Dinner Service"
                description = "Three-course meal"
                start_time = "2025-11-15T19:00:00Z"
                duration = 90
                type = "meal"
                guest_visible = $true
            },
            @{
                label = "Birthday Toast & Cake"
                description = "Special speech and cake cutting ceremony"
                start_time = "2025-11-15T20:30:00Z"
                duration = 30
                type = "speech"
                guest_visible = $true
                notify_before = 15
            },
            @{
                label = "Dancing & Entertainment"
                description = "DJ and dance floor open"
                start_time = "2025-11-15T21:00:00Z"
                duration = 120
                type = "performance"
                guest_visible = $true
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $timeline = Invoke-RestMethod -Uri "$API_BASE/timeline" -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $AUTH_TOKEN"
            } `
            -Body $timelineBody
        $timeline | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 8. GET TIMELINE
# ============================================
if ($EVENT_ID) {
    Write-Host "8. Fetching Event Timeline..." -ForegroundColor Yellow
    try {
        $timeline = Invoke-RestMethod -Uri "$API_BASE/timeline?event_id=$EVENT_ID" -Method Get `
            -Headers @{ "Authorization" = "Bearer $AUTH_TOKEN" }
        $timeline | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# 9. LIST ALL EVENTS
# ============================================
Write-Host "9. Listing All Events..." -ForegroundColor Yellow
try {
    $allEvents = Invoke-RestMethod -Uri "$API_BASE/events" -Method Get `
        -Headers @{ "Authorization" = "Bearer $AUTH_TOKEN" }
    $allEvents | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# ============================================
# 10. CREATE WEDDING EVENT
# ============================================
Write-Host "10. Creating Wedding Event..." -ForegroundColor Yellow
$weddingBody = @{
    template_type = "wedding"
    title = "Emma & James Wedding"
    description = "Join us as we say I do!"
    start_date = "2025-12-20T15:00:00Z"
    end_date = "2025-12-20T23:00:00Z"
    timezone = "America/Los_Angeles"
    location_name = "Seaside Chapel"
    location_address = "456 Ocean Drive, Malibu, CA 90265"
    privacy = "private"
    settings = @{
        ceremony_time = "15:00"
        reception_time = "18:00"
        dress_code = "Black Tie"
        rsvp_deadline = "2025-11-20"
    }
} | ConvertTo-Json -Depth 10

try {
    $weddingResponse = Invoke-RestMethod -Uri "$API_BASE/events" -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AUTH_TOKEN"
        } `
        -Body $weddingBody
    
    $weddingResponse | ConvertTo-Json -Depth 10
    $WEDDING_ID = if ($weddingResponse.id) { $weddingResponse.id } else { $weddingResponse.data.id }
    Write-Host "Wedding Event ID: $WEDDING_ID" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# ============================================
# SUMMARY
# ============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Birthday Event ID: $EVENT_ID" -ForegroundColor Green
Write-Host "Wedding Event ID: $WEDDING_ID" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Replace AUTH_TOKEN with actual JWT token"
Write-Host "2. Test guest check-in with QR codes"
Write-Host "3. Test timeline block updates"
Write-Host "4. Test event deletion"
Write-Host ""
