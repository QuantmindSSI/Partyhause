#!/bin/bash
# Template Implementation API Testing Script
# Test Events, Guests, and Timeline APIs

# Configuration
API_BASE="https://partyhause.vercel.app/api"
SUPABASE_URL="https://awokklruxeofxsqxcsnt.supabase.co"
# Replace with your actual auth token after login
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

echo "=========================================="
echo "Template Implementation API Tests"
echo "=========================================="
echo ""

# ============================================
# 1. CREATE EVENT (Birthday Template)
# ============================================
echo "1. Creating Birthday Event..."
EVENT_RESPONSE=$(curl -s -X POST "$API_BASE/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "template_type": "birthday",
    "title": "Sarah'\''s 30th Birthday Bash",
    "description": "Join us for an unforgettable celebration!",
    "start_date": "2025-11-15T18:00:00Z",
    "end_date": "2025-11-15T23:00:00Z",
    "timezone": "America/New_York",
    "location_name": "The Garden Venue",
    "location_address": "123 Party Lane, New York, NY 10001",
    "privacy": "private",
    "settings": {
      "theme": "Garden Party",
      "dress_code": "Cocktail Attire",
      "gift_registry": "https://registry.example.com"
    }
  }')

echo "$EVENT_RESPONSE" | jq '.'
EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.id // .data.id // empty')
echo "Event ID: $EVENT_ID"
echo ""

# ============================================
# 2. GET EVENT
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "2. Retrieving Event..."
  curl -s -X GET "$API_BASE/events?id=$EVENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
  echo ""
fi

# ============================================
# 3. UPDATE EVENT STATUS
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "3. Publishing Event..."
  curl -s -X PATCH "$API_BASE/events" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
      \"id\": \"$EVENT_ID\",
      \"status\": \"published\"
    }" | jq '.'
  echo ""
fi

# ============================================
# 4. BULK IMPORT GUESTS
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "4. Importing Guests..."
  curl -s -X POST "$API_BASE/guests" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
      \"event_id\": \"$EVENT_ID\",
      \"guests\": [
        {
          \"name\": \"John Doe\",
          \"email\": \"john@example.com\",
          \"phone\": \"+1-555-0101\",
          \"plus_ones\": 1
        },
        {
          \"name\": \"Jane Smith\",
          \"email\": \"jane@example.com\",
          \"phone\": \"+1-555-0102\",
          \"dietary_restrictions\": [\"vegetarian\"]
        },
        {
          \"name\": \"Bob Johnson\",
          \"email\": \"bob@example.com\",
          \"rsvp_status\": \"accepted\"
        }
      ]
    }" | jq '.'
  echo ""
fi

# ============================================
# 5. GET GUEST LIST WITH RSVP STATS
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "5. Fetching Guest List & RSVP Stats..."
  curl -s -X GET "$API_BASE/guests?event_id=$EVENT_ID&include_stats=true" \
    -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
  echo ""
fi

# ============================================
# 6. UPDATE GUEST RSVP
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "6. Updating Guest RSVP..."
  # Get first guest ID from the list
  GUEST_ID=$(curl -s -X GET "$API_BASE/guests?event_id=$EVENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | jq -r '.guests[0].id // .data[0].id // empty')
  
  if [ ! -z "$GUEST_ID" ]; then
    curl -s -X PATCH "$API_BASE/guests" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "{
        \"id\": \"$GUEST_ID\",
        \"rsvp_status\": \"accepted\",
        \"dietary_restrictions\": [\"gluten-free\", \"nut-free\"]
      }" | jq '.'
    echo ""
  fi
fi

# ============================================
# 7. CREATE TIMELINE BLOCKS
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "7. Creating Timeline Blocks..."
  curl -s -X POST "$API_BASE/timeline" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
      \"event_id\": \"$EVENT_ID\",
      \"blocks\": [
        {
          \"label\": \"Guest Arrival & Cocktails\",
          \"description\": \"Welcome drinks and mingling\",
          \"start_time\": \"2025-11-15T18:00:00Z\",
          \"duration\": 60,
          \"type\": \"activity\",
          \"guest_visible\": true,
          \"notify_before\": 30
        },
        {
          \"label\": \"Dinner Service\",
          \"description\": \"Three-course meal\",
          \"start_time\": \"2025-11-15T19:00:00Z\",
          \"duration\": 90,
          \"type\": \"meal\",
          \"guest_visible\": true
        },
        {
          \"label\": \"Birthday Toast & Cake\",
          \"description\": \"Special speech and cake cutting ceremony\",
          \"start_time\": \"2025-11-15T20:30:00Z\",
          \"duration\": 30,
          \"type\": \"speech\",
          \"guest_visible\": true,
          \"notify_before\": 15
        },
        {
          \"label\": \"Dancing & Entertainment\",
          \"description\": \"DJ and dance floor open\",
          \"start_time\": \"2025-11-15T21:00:00Z\",
          \"duration\": 120,
          \"type\": \"performance\",
          \"guest_visible\": true
        }
      ]
    }" | jq '.'
  echo ""
fi

# ============================================
# 8. GET TIMELINE
# ============================================
if [ ! -z "$EVENT_ID" ]; then
  echo "8. Fetching Event Timeline..."
  curl -s -X GET "$API_BASE/timeline?event_id=$EVENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
  echo ""
fi

# ============================================
# 9. LIST ALL EVENTS
# ============================================
echo "9. Listing All Events..."
curl -s -X GET "$API_BASE/events" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

# ============================================
# 10. CREATE WEDDING EVENT
# ============================================
echo "10. Creating Wedding Event..."
WEDDING_RESPONSE=$(curl -s -X POST "$API_BASE/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "template_type": "wedding",
    "title": "Emma & James Wedding",
    "description": "Join us as we say I do!",
    "start_date": "2025-12-20T15:00:00Z",
    "end_date": "2025-12-20T23:00:00Z",
    "timezone": "America/Los_Angeles",
    "location_name": "Seaside Chapel",
    "location_address": "456 Ocean Drive, Malibu, CA 90265",
    "privacy": "private",
    "settings": {
      "ceremony_time": "15:00",
      "reception_time": "18:00",
      "dress_code": "Black Tie",
      "rsvp_deadline": "2025-11-20"
    }
  }')

echo "$WEDDING_RESPONSE" | jq '.'
WEDDING_ID=$(echo "$WEDDING_RESPONSE" | jq -r '.id // .data.id // empty')
echo "Wedding Event ID: $WEDDING_ID"
echo ""

# ============================================
# SUMMARY
# ============================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Birthday Event ID: $EVENT_ID"
echo "Wedding Event ID: $WEDDING_ID"
echo ""
echo "Next steps:"
echo "1. Replace AUTH_TOKEN with actual JWT token"
echo "2. Test guest check-in with QR codes"
echo "3. Test timeline block updates"
echo "4. Test event deletion"
echo ""
