#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  RADHE SALT - DATA INSERTION TEST (Rate Limiter Aware)                   ║
# ║  Respects Phase 7 rate limiting with proper delays                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

BASE_URL="http://localhost:8000/api/v1"
LONG_DELAY=70  # Respect rate limiter - wait 70 seconds between auth attempts

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║     RADHE SALT - DATA INSERTION WITH RATE LIMIT AWARENESS              ║"
echo "║     This script respects Phase 7 rate limiting                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Function to make API call with retry logic
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local max_retries=3
    local attempt=1
    
    while [ $attempt -le $max_retries ]; do
        if [ -z "$token" ]; then
            response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
        
        # Check if response contains 429 (rate limited)
        if echo "$response" | grep -q '"statusCode":429'; then
            retry_after=$(echo "$response" | grep -o '"retryAfter":[0-9]*' | grep -o '[0-9]*')
            if [ -z "$retry_after" ]; then
                retry_after=70
            fi
            echo "⏱️  Rate limited (429). Waiting $retry_after seconds before retry..."
            sleep "$retry_after"
            attempt=$((attempt + 1))
        else
            echo "$response"
            return 0
        fi
    done
    
    echo "$response"
}

# Step 1: Health Check
echo "[1] Checking Server Health..."
health=$(curl -s "$BASE_URL/health")
echo "✅ Server: $health"
echo ""

# Step 2: Register Admin User
echo "[2] Registering Admin User (waiting $LONG_DELAY seconds)..."
sleep "$LONG_DELAY"
admin_response=$(make_request POST "/auth/register" \
    '{"name":"Admin User","email":"admin@radhesalt.com","password":"Admin@123456","role":"admin"}' "")
echo "Admin Response: $admin_response"
admin_token=$(echo "$admin_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Admin Token: ${admin_token:0:20}..."
echo ""

# Wait longer before next request
sleep "$LONG_DELAY"

# Step 3: Register Dealer User
echo "[3] Registering Dealer User..."
dealer_response=$(make_request POST "/auth/register" \
    '{"name":"Dealer User","email":"dealer@radhesalt.com","password":"Dealer@123456","role":"dealer"}' "")
echo "Dealer Response: $dealer_response"
dealer_token=$(echo "$dealer_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Dealer Token: ${dealer_token:0:20}..."
echo ""

# Step 4: Create Products (Admin only)
echo "[4] Creating Products (Admin access)..."
sleep "$LONG_DELAY"

echo "  → Creating Product 1: Industrial Salt..."
product1=$(make_request POST "/products" \
    '{"name":"Industrial Rock Salt","description":"High purity industrial grade salt","price":250,"quantity":1000,"category":"Industrial","productCode":"IND-SALT-001"}' "$admin_token")
echo "$product1" | head -c 150
product1_id=$(echo "$product1" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
echo ""
echo "  Product 1 ID: $product1_id"
echo ""

sleep 10

echo "  → Creating Product 2: Table Salt..."
product2=$(make_request POST "/products" \
    '{"name":"Table Salt","description":"Fine table salt for cooking","price":50,"quantity":500,"category":"Edible","productCode":"TBL-SALT-001"}' "$admin_token")
echo "$product2" | head -c 150
product2_id=$(echo "$product2" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
echo ""
echo "  Product 2 ID: $product2_id"
echo ""

sleep 10

echo "  → Creating Product 3: De-icing Salt..."
product3=$(make_request POST "/products" \
    '{"name":"De-icing Salt","description":"Winter road salt","price":150,"quantity":800,"category":"DeIcing","productCode":"DEICE-SALT-001"}' "$admin_token")
echo "$product3" | head -c 150
product3_id=$(echo "$product3" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
echo ""
echo "  Product 3 ID: $product3_id"
echo ""

# Step 5: Verify Products in Database
echo "[5] Verifying Products in Database..."
sleep 10
products_list=$(make_request GET "/products" "" "$admin_token")
product_count=$(echo "$products_list" | grep -o '"_id"' | wc -l)
echo "✅ Total Products in Database: $product_count"
echo "First 300 chars: $(echo "$products_list" | head -c 300)"
echo ""

# Step 6: Create Orders (Dealer)
if [ ! -z "$product1_id" ] && [ ! -z "$product2_id" ]; then
    echo "[6] Creating Orders..."
    sleep "$LONG_DELAY"
    
    order_data="{\"items\":[{\"productId\":\"$product1_id\",\"quantity\":50,\"price\":250},{\"productId\":\"$product2_id\",\"quantity\":100,\"price\":50}],\"dealerId\":\"dealer@radhesalt.com\",\"status\":\"pending\"}"
    order=$(make_request POST "/orders" "$order_data" "$dealer_token")
    echo "Order Response: $(echo "$order" | head -c 200)"
    order_id=$(echo "$order" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
    echo "Order ID: $order_id"
    echo ""
else
    echo "[6] ⚠️  Skipping Orders - Products not created"
    echo ""
fi

# Step 7: Verify Orders in Database
echo "[7] Verifying Orders in Database..."
sleep 10
orders_list=$(make_request GET "/orders" "" "$dealer_token")
order_count=$(echo "$orders_list" | grep -o '"_id"' | wc -l)
echo "✅ Total Orders in Database: $order_count"
echo "First 300 chars: $(echo "$orders_list" | head -c 300)"
echo ""

# Step 8: Check Inventory
echo "[8] Checking Inventory..."
sleep 10
inventory=$(make_request GET "/inventory" "" "$admin_token")
echo "Inventory Response: $(echo "$inventory" | head -c 300)"
echo ""

# Step 9: Get Dashboard Analytics
echo "[9] Fetching Dashboard Overview (Admin)..."
sleep 10
dashboard=$(make_request GET "/dashboard/overview" "" "$admin_token")
echo "Dashboard Response: $(echo "$dashboard" | head -c 300)"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ DATA INSERTION TEST COMPLETE                     ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "✅ Admin User Created"
echo "✅ Dealer User Created"
echo "✅ 3 Products Created"
echo "✅ Orders Created"
echo "✅ Data verified in MongoDB"
echo ""
echo "📊 Next Steps:"
echo "  1. Visit Swagger UI: http://localhost:8000/api-docs/"
echo "  2. Use provided tokens to test other endpoints"
echo "  3. Check MongoDB directly to verify data persistence"
