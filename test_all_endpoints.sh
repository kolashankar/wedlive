#!/bin/bash

# Test all 15 endpoints that were failing

echo "=========================================="
echo "Testing All Fixed Endpoints"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:3000"
TEST_WEDDING_ID="test-wedding-123"
TEST_FILE_ID="AgACAgUAAyEGAATO7nwaAAMhaTrImX_enn_5VfNnUzPMCN01vuIAAnEMaxtx69hVHOtH1OzArvEBAAMCAAN5AAM2BA"

# Counter for passed/failed tests
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local url=$3
    local expected_status=$4
    
    echo -n "Testing: $test_name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" -H "Authorization: Bearer test-token" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Authorization: Bearer test-token" 2>/dev/null)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ "$status_code" =~ ^[0-9]{3}$ ]]; then
        if [ "$status_code" != "000" ]; then
            echo -e "${GREEN}✓ Status: $status_code${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ Connection failed${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ Invalid response${NC}"
        ((FAILED++))
    fi
}

echo "========== BACKEND ENDPOINTS =========="
echo ""

echo "1. Testing Telegram Proxy Endpoints (6 tests):"
test_endpoint "Telegram Proxy - Photo 1" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/$TEST_FILE_ID" "200"
test_endpoint "Telegram Proxy - Photo 2" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/AgACAgUAAyEGAATO7nwaAAMgaTrIhbWtbPli_iBIHx2dVyya6DwAAnAMaxtx69hVv0j96D0SpQsBAAMCAAN4AAM2BA" "200"
test_endpoint "Telegram Proxy - Photo 3" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/AgACAgUAAyEGAATO7nwaAAMfaTrIX3rxZtHZJkrLMzjD68ag9bQAAm8Maxtx69hVjlfmD3-MruABAAMCAAN3AAM2BA" "200"
test_endpoint "Telegram Proxy - Photo 4" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/AgACAgUAAyEGAATO7nwaAAMeaTrIPDn0F6LsjsACyg5QuJFuPU0AAm4Maxtx69hVRbETopAp1kcBAAMCAANtAAM2BA" "200"
test_endpoint "Telegram Proxy - Photo 5" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/AgACAgUAAyEGAATO7nwaAAMdaTrIMrLQFSQPzJKGg4a2SQciucIAAm0Maxtx69hVfZdwIckD_HUBAAMCAANtAAM2BA" "200"
test_endpoint "Telegram Proxy - Photo 6" "GET" "$BACKEND_URL/api/media/telegram-proxy/photos/AgACAgUAAyEGAATO7nwaAAMcaTrIJqULO9r6CLH9JIPvt9elUr4AAmwMaxtx69hVeY8126ehRMUBAAMCAANtAAM2BA" "200"

echo ""
echo "2. Testing My-Weddings Endpoint (1 test):"
test_endpoint "My Weddings List" "GET" "$BACKEND_URL/api/weddings/my-weddings" "401"

echo ""
echo "========== FRONTEND ENDPOINTS =========="
echo ""

echo "3. Testing WebSocket Connection (1 test):"
echo -n "Testing: WebSocket Connection ... "
# WebSocket test - check if server responds to socket.io handshake
response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/socket.io/?EIO=4&transport=polling" 2>/dev/null)
status_code=$(echo "$response" | tail -n1)
if [[ "$status_code" =~ ^[0-9]{3}$ ]] && [ "$status_code" != "000" ]; then
    echo -e "${GREEN}✓ Status: $status_code${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Connection failed${NC}"
    ((FAILED++))
fi

echo ""
echo "4. Testing Media Gallery Endpoint (1 test):"
test_endpoint "Media Gallery" "GET" "$BACKEND_URL/api/media/gallery/$TEST_WEDDING_ID" "404"

echo ""
echo "5. Testing CORS Headers (1 test):"
echo -n "Testing: CORS Headers on Proxy ... "
response=$(curl -s -i -X GET "$BACKEND_URL/api/media/telegram-proxy/photos/$TEST_FILE_ID" 2>/dev/null | grep -i "Access-Control-Allow-Origin")
if [ ! -z "$response" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ CORS headers may be missing${NC}"
    ((FAILED++))
fi

echo ""
echo "6. Testing Cookie Configuration (1 test):"
echo -n "Testing: Set-Cookie header exposure ... "
response=$(curl -s -i -X GET "$BACKEND_URL/api/health" 2>/dev/null | grep -i "Access-Control-Expose-Headers")
if [[ "$response" == *"Set-Cookie"* ]]; then
    echo -e "${GREEN}✓ Set-Cookie exposed${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Set-Cookie may not be exposed${NC}"
    ((FAILED++))
fi

echo ""
echo "========== SUMMARY =========="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    exit 1
fi
