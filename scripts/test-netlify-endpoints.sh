#!/bin/bash

# Test all Netlify API endpoints
# Run: chmod +x scripts/test-netlify-endpoints.sh && ./scripts/test-netlify-endpoints.sh

BASE_URL="https://partyhause.netlify.app"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Netlify API Endpoints"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local name=$3
    
    echo -n "Testing $name ($method $endpoint)... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "401" ] || [ "$response" == "400" ]; then
        echo -e "${GREEN}✓ $response${NC}"
        return 0
    else
        echo -e "${RED}✗ $response${NC}"
        return 1
    fi
}

# Test core endpoints
echo "📦 Core Endpoints"
echo "----------------"
test_endpoint "GET" "/api/health" "Health Check"
test_endpoint "GET" "/api/events" "Events List"
test_endpoint "GET" "/api/event-templates" "Event Templates"
test_endpoint "GET" "/api/templates" "Templates"
test_endpoint "GET" "/api/test" "Test Endpoint"
test_endpoint "GET" "/api/ping" "Ping"
echo ""

# Test PartyCrew endpoints (will return 401 without auth, which is expected)
echo "👥 PartyCrew Social Endpoints"
echo "----------------------------"
test_endpoint "POST" "/api/partycrew/toggle" "PartyCrew Toggle"
test_endpoint "GET" "/api/partycrew/members" "PartyCrew Members"
test_endpoint "GET" "/api/partycrew/crewing-with" "Crewing With"
test_endpoint "GET" "/api/partycrew/requests" "Connection Requests"
echo ""

# Test user endpoints (will return 401 without auth)
echo "👤 User Endpoints"
echo "----------------"
test_endpoint "GET" "/api/users/suggested" "Suggested Users"
test_endpoint "GET" "/api/users/test-id" "User by ID"
echo ""

# Test feed endpoint (will return 401 without auth)
echo "📰 Feed Endpoints"
echo "----------------"
test_endpoint "GET" "/api/feed/crew" "PartyCrew Feed"
echo ""

# Test event-related endpoints
echo "📅 Event Management"
echo "------------------"
test_endpoint "GET" "/api/guests" "Event Guests"
test_endpoint "GET" "/api/timeline" "Event Timeline"
test_endpoint "POST" "/api/create-event-from-template" "Create from Template"
echo ""

# Test email endpoints
echo "📧 Email Endpoints"
echo "-----------------"
test_endpoint "POST" "/api/send-email" "Send Email"
test_endpoint "POST" "/api/email-webhook" "Email Webhook"
echo ""

echo "================================"
echo "🎉 Endpoint testing complete!"
echo ""
echo "Note: 401 (Unauthorized) responses are expected for authenticated endpoints"
echo "Note: 400 (Bad Request) responses are expected when no data is provided"
echo ""

# Test health endpoint in detail
echo "📋 Detailed Health Check"
echo "------------------------"
curl -s "$BASE_URL/api/health" | jq . || curl -s "$BASE_URL/api/health"
echo ""
echo ""

echo "🔗 Quick Links:"
echo "  • App: $BASE_URL"
echo "  • Health: $BASE_URL/api/health"
echo "  • Admin: https://app.netlify.com/sites/partyhause"
echo ""
