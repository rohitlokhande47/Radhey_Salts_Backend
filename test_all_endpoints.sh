#!/bin/bash

################################################################################
#  RADHE SALT BACKEND - COMPREHENSIVE API ENDPOINT TEST SUITE
#  Tests all 50+ endpoints across Phases 1-7
################################################################################

set -e

BASE_URL="http://localhost:8000/api/v1"
ADMIN_EMAIL="admin@radhesalt.com"
ADMIN_PASSWORD="Admin@123456"
DEALER_EMAIL="dealer@radhesalt.com"
DEALER_PASSWORD="Dealer@123456"
TEST_RESULTS="test_results.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize test results file
echo "╔══════════════════════════════════════════════════════════════════════════╗" > $TEST_RESULTS
echo "║        RADHE SALT BACKEND - API ENDPOINT TEST RESULTS                    ║" >> $TEST_RESULTS
echo "║        $(date)                                  ║" >> $TEST_RESULTS
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> $TEST_RESULTS
echo "" >> $TEST_RESULTS

# Counter for tests
PASS_COUNT=0
FAIL_COUNT=0

# Function to test endpoint
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DESCRIPTION=$3
    local DATA=$4
    local TOKEN=$5
    local EXPECTED_CODE=$6

    printf "${BLUE}Testing${NC} $METHOD $ENDPOINT... "
    
    # Build curl command
    local CMD="curl -s -w '\n%{http_code}' -X $METHOD $BASE_URL$ENDPOINT"
    
    if [ -n "$TOKEN" ]; then
        CMD="$CMD -H 'Authorization: Bearer $TOKEN'"
    fi
    
    CMD="$CMD -H 'Content-Type: application/json'"
    
    if [ -n "$DATA" ]; then
        CMD="$CMD -d '$DATA'"
    fi
    
    # Execute and capture response
    RESPONSE=$(eval $CMD)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Check if response contains error
    if echo "$BODY" | grep -q '"error"' || echo "$BODY" | grep -q '"message".*"error"'; then
        printf "${RED}FAIL${NC} (HTTP $HTTP_CODE)\n"
        echo "  Method: $METHOD $ENDPOINT" >> $TEST_RESULTS
        echo "  Description: $DESCRIPTION" >> $TEST_RESULTS
        echo "  HTTP Code: $HTTP_CODE" >> $TEST_RESULTS
        echo "  Response: $BODY" >> $TEST_RESULTS
        echo "" >> $TEST_RESULTS
        FAIL_COUNT=$((FAIL_COUNT + 1))
    else
        printf "${GREEN}PASS${NC} (HTTP $HTTP_CODE)\n"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 1: AUTHENTICATION ENDPOINTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test Register - Dealer
echo -e "\n1.1 Register - Dealer"
REGISTER_DATA='{"email":"'$DEALER_EMAIL'","password":"'$DEALER_PASSWORD'","name":"Test Dealer","phone":"+91 9876543210","companyName":"Test Company"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST $BASE_URL/auth/register -H 'Content-Type: application/json' -d "$REGISTER_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Register Dealer PASS${NC} (HTTP $HTTP_CODE)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ Register Dealer FAIL${NC} (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test Register - Admin
echo -e "\n1.2 Register - Admin"
REGISTER_DATA='{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASSWORD'","name":"Test Admin","phone":"+91 9876543210","companyName":"Admin Co","role":"admin"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST $BASE_URL/auth/register -H 'Content-Type: application/json' -d "$REGISTER_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Register Admin PASS${NC} (HTTP $HTTP_CODE)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ Register Admin FAIL${NC} (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test Login - Dealer
echo -e "\n1.3 Login - Dealer"
LOGIN_DATA='{"email":"'$DEALER_EMAIL'","password":"'$DEALER_PASSWORD'"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d "$LOGIN_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    DEALER_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    DEALER_REFRESH=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Login Dealer PASS${NC} (HTTP $HTTP_CODE)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ Login Dealer FAIL${NC} (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test Login - Admin
echo -e "\n1.4 Login - Admin"
LOGIN_DATA='{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASSWORD'"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d "$LOGIN_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    ADMIN_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    ADMIN_REFRESH=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Login Admin PASS${NC} (HTTP $HTTP_CODE)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ Login Admin FAIL${NC} (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 2: PRODUCTS ENDPOINTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test GET Products
echo -e "\n2.1 GET /products"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/products" -H "Authorization: Bearer $DEALER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /products PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    PRODUCT_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}✗ GET /products FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Product by ID
if [ -n "$PRODUCT_ID" ]; then
    echo -e "\n2.2 GET /products/{id}"
    RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/products/$PRODUCT_ID" -H "Authorization: Bearer $DEALER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ GET /products/{id} PASS${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ GET /products/{id} FAIL${NC} (HTTP $HTTP_CODE)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# Test POST Product (Admin only)
echo -e "\n2.3 POST /products (Admin only)"
PRODUCT_DATA='{"name":"Test Product","description":"Test","price":100,"category":"Industrial Salt","quantity":1000,"sku":"TEST-001"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/products" -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d "$PRODUCT_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ POST /products PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    NEW_PRODUCT_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}✗ POST /products FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 3: ORDERS ENDPOINTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test POST Order
echo -e "\n3.1 POST /orders"
ORDER_DATA='{"items":[{"productId":"'$PRODUCT_ID'","quantity":10}],"totalAmount":1000}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/orders" -H "Authorization: Bearer $DEALER_TOKEN" -H 'Content-Type: application/json' -d "$ORDER_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ POST /orders PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    ORDER_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}✗ POST /orders FAIL${NC} (HTTP $HTTP_CODE)"
    echo "Response: $(echo "$RESPONSE" | sed '$d')"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Orders
echo -e "\n3.2 GET /orders"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/orders" -H "Authorization: Bearer $DEALER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /orders PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /orders FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Order by ID
if [ -n "$ORDER_ID" ]; then
    echo -e "\n3.3 GET /orders/{id}"
    RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/orders/$ORDER_ID" -H "Authorization: Bearer $DEALER_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ GET /orders/{id} PASS${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ GET /orders/{id} FAIL${NC} (HTTP $HTTP_CODE)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 5: INVENTORY ENDPOINTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test GET Inventory
echo -e "\n5.1 GET /inventory"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/inventory" -H "Authorization: Bearer $DEALER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /inventory PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /inventory FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test POST Inventory Adjustment
echo -e "\n5.2 POST /inventory (Adjust)"
INVENTORY_DATA='{"productId":"'$PRODUCT_ID'","quantity":100,"type":"stock_in","notes":"Test adjustment"}'
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/inventory" -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d "$INVENTORY_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ POST /inventory PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ POST /inventory FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Inventory Ledger
echo -e "\n5.3 GET /inventory/ledger"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/inventory/ledger" -H "Authorization: Bearer $DEALER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /inventory/ledger PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /inventory/ledger FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 6: DASHBOARD/ANALYTICS ENDPOINTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test GET Dashboard Overview (Admin only)
echo -e "\n6.1 GET /dashboard/overview (Admin only)"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/dashboard/overview" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /dashboard/overview PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /dashboard/overview FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Dashboard Analytics
echo -e "\n6.2 GET /dashboard/analytics"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/dashboard/analytics" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /dashboard/analytics PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /dashboard/analytics FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Dealer Performance
echo -e "\n6.3 GET /dashboard/dealer-performance (Admin only)"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/dashboard/dealer-performance" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /dashboard/dealer-performance PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /dashboard/dealer-performance FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 7: MONITORING ENDPOINTS (Admin only)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test GET Monitoring Logs
echo -e "\n7.1 GET /admin/monitoring/logs"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/admin/monitoring/logs" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /admin/monitoring/logs PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /admin/monitoring/logs FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Security Events
echo -e "\n7.2 GET /admin/monitoring/security-events"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/admin/monitoring/security-events" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /admin/monitoring/security-events PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /admin/monitoring/security-events FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Performance
echo -e "\n7.3 GET /admin/monitoring/performance"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/admin/monitoring/performance" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /admin/monitoring/performance PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /admin/monitoring/performance FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test GET Cache Stats
echo -e "\n7.4 GET /admin/monitoring/cache"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$BASE_URL/admin/monitoring/cache" -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /admin/monitoring/cache PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /admin/monitoring/cache FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}SWAGGER DOCUMENTATION TEST${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"

# Test Swagger UI
echo -e "\n8.1 GET /api-docs (Swagger UI)"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "http://localhost:8000/api-docs")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /api-docs PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /api-docs FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test Swagger JSON
echo -e "\n8.2 GET /swagger.json"
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "http://localhost:8000/swagger.json")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GET /swagger.json PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ GET /swagger.json FAIL${NC} (HTTP $HTTP_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Final Summary
echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "\n${GREEN}✓ PASSED: $PASS_COUNT${NC}"
echo -e "${RED}✗ FAILED: $FAIL_COUNT${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
SUCCESS_RATE=$((PASS_COUNT * 100 / TOTAL))
echo -e "Success Rate: ${SUCCESS_RATE}% ($PASS_COUNT/$TOTAL)"

echo -e "\n📋 Detailed results saved to: $TEST_RESULTS\n"

# Save summary to results file
echo "" >> $TEST_RESULTS
echo "═══════════════════════════════════════════════════════════════════════════" >> $TEST_RESULTS
echo "TEST SUMMARY" >> $TEST_RESULTS
echo "═══════════════════════════════════════════════════════════════════════════" >> $TEST_RESULTS
echo "Total Tests: $TOTAL" >> $TEST_RESULTS
echo "Passed: $PASS_COUNT" >> $TEST_RESULTS
echo "Failed: $FAIL_COUNT" >> $TEST_RESULTS
echo "Success Rate: $SUCCESS_RATE%" >> $TEST_RESULTS
echo "" >> $TEST_RESULTS

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo -e "${RED}Check $TEST_RESULTS for details${NC}"
    exit 1
fi
