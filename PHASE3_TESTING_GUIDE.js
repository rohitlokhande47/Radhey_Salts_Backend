/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: PRODUCT MANAGEMENT APIS - COMPREHENSIVE TESTING GUIDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This guide contains 20+ test scenarios with curl commands for testing
 * all Product Management API endpoints.
 *
 * Prerequisites:
 * 1. Server running: npm run dev
 * 2. Admin logged in (have JWT token)
 * 3. MongoDB with test data (optional)
 */

// ═════════════════════════════════════════════════════════════════════════
// SECTION 1: SETUP & PREREQUISITES
// ═════════════════════════════════════════════════════════════════════════

const SETUP_INSTRUCTIONS = `
STEP 1: Start Server
────────────────────────────────────────────────────────────────────────────
$ npm run dev

Expected output:
  ✓ Connected to MongoDB
  ✓ Server running on port 8000
  ✓ Ready for requests

STEP 2: Get Admin JWT Token
────────────────────────────────────────────────────────────────────────────
$ curl -X POST http://localhost:8000/api/v1/auth/admin/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

SAVE THIS TOKEN for use in all admin-only tests:
$ export JWT_TOKEN="<paste_your_token_here>"

STEP 3: Store Base URL
────────────────────────────────────────────────────────────────────────────
$ export BASE_URL="http://localhost:8000/api/v1"
`;

// ═════════════════════════════════════════════════════════════════════════
// SECTION 2: PUBLIC ENDPOINT TESTS
// ═════════════════════════════════════════════════════════════════════════

const PUBLIC_TESTS = {
  test1_getAvailableProducts: {
    name: "✅ Test 1: Get all available products",
    description: "Fetch products with pagination (public endpoint)",
    method: "GET",
    endpoint: "/products",
    curl: `curl -X GET "$BASE_URL/products?page=1&limit=10"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        products: "array of product objects",
        pagination: {
          page: 1,
          limit: 10,
          total: "number",
          totalPages: "number",
        },
      },
    },
  },

  test2_searchProducts: {
    name: "✅ Test 2: Search products by name",
    description: "Search for products by name containing 'salt'",
    method: "GET",
    endpoint: "/products",
    curl: `curl -X GET "$BASE_URL/products?search=salt&limit=5"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        products: "array with name containing 'salt'",
      },
    },
  },

  test3_filterByCategory: {
    name: "✅ Test 3: Filter products by category",
    description: "Get only salt products",
    method: "GET",
    endpoint: "/products",
    curl: `curl -X GET "$BASE_URL/products?category=salt&limit=10"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        products: "array with category='salt'",
      },
    },
  },

  test4_sortByPrice: {
    name: "✅ Test 4: Sort products by price",
    description: "Get products sorted by price ascending",
    method: "GET",
    endpoint: "/products",
    curl: `curl -X GET "$BASE_URL/products?sortBy=price&sortOrder=asc"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        products: "array sorted by price ascending",
      },
    },
  },

  test5_getSingleProduct: {
    name: "✅ Test 5: Get single product details",
    description: "Fetch single product with pricing examples",
    method: "GET",
    endpoint: "/products/:id",
    curl: `curl -X GET "$BASE_URL/products/507f1f77bcf86cd799439011"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        _id: "product id",
        name: "product name",
        pricingExamples: "array of pricing for qty 1,5,10,25,50,100",
      },
    },
  },

  test6_getPricingMOQ100: {
    name: "✅ Test 6: Get pricing for quantity (meets MOQ)",
    description: "Get pricing for quantity >= MOQ",
    method: "GET",
    endpoint: "/products/:id/pricing",
    curl: `curl -X GET "$BASE_URL/products/507f1f77bcf86cd799439011/pricing?quantity=100"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        quantity: 100,
        MOQ: 100,
        unitPrice: "number",
        totalPrice: "number",
        canOrder: true,
      },
    },
  },

  test7_getPricingBulk: {
    name: "✅ Test 7: Get bulk pricing (quantity > MOQ)",
    description: "Get pricing with bulk discount for large quantity",
    method: "GET",
    endpoint: "/products/:id/pricing",
    curl: `curl -X GET "$BASE_URL/products/507f1f77bcf86cd799439011/pricing?quantity=500"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        quantity: 500,
        unitPrice: "lower than base price",
        discount: "non-zero percentage",
        canOrder: true,
      },
    },
  },

  test8_getPricingMOQViolation: {
    name: "❌ Test 8: Get pricing for quantity below MOQ (Error)",
    description: "Should fail when quantity < MOQ",
    method: "GET",
    endpoint: "/products/:id/pricing",
    curl: `curl -X GET "$BASE_URL/products/507f1f77bcf86cd799439011/pricing?quantity=50"`,
    expectedStatus: 400,
    expectedResponse: {
      success: false,
      message: "Minimum order quantity is 100. Requested: 50",
    },
  },

  test9_getSingleProductNotFound: {
    name: "❌ Test 9: Get product not found (Error)",
    description: "Should return 404 for non-existent product",
    method: "GET",
    endpoint: "/products/:id",
    curl: `curl -X GET "$BASE_URL/products/999f1f77bcf86cd799999999"`,
    expectedStatus: 404,
    expectedResponse: {
      success: false,
      message: "Product not found",
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 3: ADMIN ENDPOINT TESTS (CREATE, UPDATE, DELETE)
// ═════════════════════════════════════════════════════════════════════════

const ADMIN_TESTS = {
  test10_createProductSuccess: {
    name: "✅ Test 10: Create product successfully",
    description: "Create new product with required fields (admin only)",
    method: "POST",
    endpoint: "/products",
    auth: "REQUIRED",
    contentType: "multipart/form-data",
    curl: `curl -X POST "$BASE_URL/products" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -F "name=Rock Salt Premium" \\
  -F "description=High quality rock salt for bulk trading" \\
  -F "productCode=SALT-TEST-001" \\
  -F "category=salt" \\
  -F "price=250" \\
  -F "MOQ=100" \\
  -F "unit=kg" \\
  -F "supplier=Supplier A" \\
  -F "hsn=25010000" \\
  -F "stockQty=5000" \\
  -F "reorderLevel=1000" \\
  -F 'pricingTiers=[{"minQty":100,"maxQty":500,"price":250}]'`,
    expectedStatus: 201,
    expectedResponse: {
      success: true,
      statusCode: 201,
      data: {
        _id: "generated id",
        name: "Rock Salt Premium",
        productCode: "SALT-TEST-001",
        isActive: true,
      },
    },
  },

  test11_createProductMissingFields: {
    name: "❌ Test 11: Create product with missing required fields",
    description: "Should fail when name is missing",
    method: "POST",
    endpoint: "/products",
    auth: "REQUIRED",
    curl: `curl -X POST "$BASE_URL/products" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Missing name field",
    "productCode": "SALT-BAD",
    "category": "salt",
    "price": 250,
    "MOQ": 100,
    "unit": "kg"
  }'`,
    expectedStatus: 400,
    expectedResponse: {
      success: false,
      message: "Missing required fields",
    },
  },

  test12_createProductDuplicateCode: {
    name: "❌ Test 12: Create product with duplicate code",
    description: "Should fail when productCode already exists",
    method: "POST",
    endpoint: "/products",
    auth: "REQUIRED",
    curl: `curl -X POST "$BASE_URL/products" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Duplicate",
    "description": "This should fail",
    "productCode": "SALT-001",
    "category": "salt",
    "price": 300,
    "MOQ": 100,
    "unit": "kg"
  }'`,
    expectedStatus: 409,
    expectedResponse: {
      success: false,
      message: "Product with code SALT-001 already exists",
    },
  },

  test13_createProductNoAuth: {
    name: "❌ Test 13: Create product without authentication",
    description: "Should fail when JWT token is missing",
    method: "POST",
    endpoint: "/products",
    curl: `curl -X POST "$BASE_URL/products" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Test",
    "description": "No auth",
    "productCode": "NOAUTH",
    "category": "salt",
    "price": 250,
    "MOQ": 100,
    "unit": "kg"
  }'`,
    expectedStatus: 401,
    expectedResponse: {
      success: false,
      message: "Access token is required",
    },
  },

  test14_updateProductSuccess: {
    name: "✅ Test 14: Update product successfully",
    description: "Update product price and MOQ",
    method: "PUT",
    endpoint: "/products/:id",
    auth: "REQUIRED",
    curl: `curl -X PUT "$BASE_URL/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price": 260,
    "MOQ": 50,
    "pricingTiers": [
      {"minQty": 50, "maxQty": 500, "price": 260},
      {"minQty": 501, "maxQty": 1000, "price": 250}
    ]
  }'`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        price: 260,
        MOQ: 50,
      },
    },
  },

  test15_updateProductInvalidPrice: {
    name: "❌ Test 15: Update product with invalid price",
    description: "Should fail when price is negative",
    method: "PUT",
    endpoint: "/products/:id",
    auth: "REQUIRED",
    curl: `curl -X PUT "$BASE_URL/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price": -100
  }'`,
    expectedStatus: 400,
    expectedResponse: {
      success: false,
      message: "Price must be positive",
    },
  },

  test16_deleteProductSuccess: {
    name: "✅ Test 16: Delete product (soft delete)",
    description: "Delete product - sets isActive to false",
    method: "DELETE",
    endpoint: "/products/:id",
    auth: "REQUIRED",
    curl: `curl -X DELETE "$BASE_URL/products/507f1f77bcf86cd799439011" \\
  -H "Authorization: Bearer $JWT_TOKEN"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      message: "Product deleted successfully",
    },
  },

  test17_deleteProductNotFound: {
    name: "❌ Test 17: Delete non-existent product",
    description: "Should fail when product not found",
    method: "DELETE",
    endpoint: "/products/:id",
    auth: "REQUIRED",
    curl: `curl -X DELETE "$BASE_URL/products/999f1f77bcf86cd799999999" \\
  -H "Authorization: Bearer $JWT_TOKEN"`,
    expectedStatus: 404,
    expectedResponse: {
      success: false,
      message: "Product not found",
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 4: RESTOCK & INVENTORY TESTS
// ═════════════════════════════════════════════════════════════════════════

const RESTOCK_TESTS = {
  test18_restockProductSuccess: {
    name: "✅ Test 18: Restock product successfully",
    description: "Add 5000 kg stock and create inventory ledger entry",
    method: "POST",
    endpoint: "/products/:id/restock",
    auth: "REQUIRED",
    curl: `curl -X POST "$BASE_URL/products/507f1f77bcf86cd799439011/restock" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "quantity": 5000,
    "reason": "new_shipment",
    "notes": "Supplier A shipment received"
  }'`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        product: {
          stockQty: "should increase by 5000",
        },
        ledgerEntry: {
          changeType: "credit",
          quantityChanged: 5000,
          previousQty: "previous stock",
          newQty: "previous + 5000",
        },
      },
    },
  },

  test19_restockProductInvalidQty: {
    name: "❌ Test 19: Restock with invalid quantity",
    description: "Should fail when quantity is not positive",
    method: "POST",
    endpoint: "/products/:id/restock",
    auth: "REQUIRED",
    curl: `curl -X POST "$BASE_URL/products/507f1f77bcf86cd799439011/restock" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "quantity": -100
  }'`,
    expectedStatus: 400,
    expectedResponse: {
      success: false,
      message: "Quantity must be a positive number",
    },
  },

  test20_getLowStockProducts: {
    name: "✅ Test 20: Get low stock products (admin dashboard)",
    description: "Get all products below reorder level",
    method: "GET",
    endpoint: "/products/admin/low-stock",
    auth: "REQUIRED",
    curl: `curl -X GET "$BASE_URL/products/admin/low-stock" \\
  -H "Authorization: Bearer $JWT_TOKEN"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: "array of low stock products",
    },
  },

  test21_getProductStatistics: {
    name: "✅ Test 21: Get product statistics (admin dashboard)",
    description: "Get aggregate statistics for admin dashboard",
    method: "GET",
    endpoint: "/products/admin/statistics",
    auth: "REQUIRED",
    curl: `curl -X GET "$BASE_URL/products/admin/statistics" \\
  -H "Authorization: Bearer $JWT_TOKEN"`,
    expectedStatus: 200,
    expectedResponse: {
      success: true,
      data: {
        totalStats: [
          {
            totalProducts: "number",
            activeProducts: "number",
            averagePrice: "number",
            totalStockValue: "number",
          },
        ],
        categoryCounts: [
          {
            _id: "category",
            count: "number",
            activeCount: "number",
          },
        ],
      },
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 5: TESTING WORKFLOW
// ═════════════════════════════════════════════════════════════════════════

const TESTING_WORKFLOW = `
PHASE 3 TEST EXECUTION PLAN
════════════════════════════════════════════════════════════════════════════

STEP 1: PUBLIC ENDPOINT TESTS (No authentication needed)
────────────────────────────────────────────────────────────────────────────
Run tests: 1-9

✅ All product browsing should work without login
✅ Pagination should work
✅ Filtering by category should work
✅ Searching should work
✅ Dynamic pricing should show correct calculations
✅ MOQ validation should reject orders below minimum

STEP 2: AUTHENTICATE AS ADMIN
────────────────────────────────────────────────────────────────────────────
$ export JWT_TOKEN="<your_token>"
$ echo $JWT_TOKEN  # Verify token is set

STEP 3: ADMIN ENDPOINT TESTS (CRUD Operations)
────────────────────────────────────────────────────────────────────────────
Run tests: 10-17

✅ Create products successfully
✅ Handle duplicate product codes
✅ Update product pricing
✅ Soft-delete products
✅ Validate all inputs
✅ Enforce role-based access control

STEP 4: RESTOCK & INVENTORY TESTS
────────────────────────────────────────────────────────────────────────────
Run tests: 18-21

✅ Restock adds stock correctly
✅ Inventory ledger entries are created
✅ Admin dashboard shows low stock
✅ Statistics aggregation works

STEP 5: VERIFY DATABASE STATE
────────────────────────────────────────────────────────────────────────────

In MongoDB (mongosh):
use radhe_salt_db

// Check products
db.products.find().pretty()

// Check inventory ledger
db.inventoryledgers.find().pretty()

// Check audit logs
db.auditlogs.find({action: "PRODUCT_*"}).pretty()

// Verify relationships
db.products.aggregate([
  {$lookup: {from: "orders", localField: "_id", foreignField: "items.productId", as: "orders"}},
  {$project: {name: 1, ordersCount: {$size: "$orders"}}}
]).pretty()

STEP 6: POSTMAN COLLECTION (Optional)
────────────────────────────────────────────────────────────────────────────

Import the collection provided at end of this file into Postman for GUI testing.

EXPECTED RESULTS
════════════════════════════════════════════════════════════════════════════

All tests should pass:
  ✅ 21 test scenarios executed
  ✅ 0 failures
  ✅ All status codes correct
  ✅ All responses validated
  ✅ MOQ validation working
  ✅ Bulk pricing correct
  ✅ RBAC enforced
  ✅ Audit trail created
  ✅ Inventory ledger updated
`;

// ═════════════════════════════════════════════════════════════════════════
// SECTION 6: QUICK TEST SCRIPTS
// ═════════════════════════════════════════════════════════════════════════

const QUICK_TEST_SCRIPTS = {
  testAll: `#!/bin/bash
# Run all 21 tests

export BASE_URL="http://localhost:8000/api/v1"
export JWT_TOKEN="<YOUR_TOKEN_HERE>"

echo "🧪 Running Phase 3 Tests..."

# Public tests
echo "📍 Test 1: Get products"
curl -s -X GET "$BASE_URL/products?limit=5" | jq '.'

echo "📍 Test 2: Get product by ID"
curl -s -X GET "$BASE_URL/products/507f1f77bcf86cd799439011" | jq '.'

echo "📍 Test 3: Get pricing"
curl -s -X GET "$BASE_URL/products/507f1f77bcf86cd799439011/pricing?quantity=100" | jq '.'

# Admin tests
echo "📍 Test 4: Create product"
curl -s -X POST "$BASE_URL/products" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test","description":"Test","productCode":"TEST-001","category":"salt","price":100,"MOQ":10,"unit":"kg"}' | jq '.'

echo "✅ Tests completed!"
  `,
};

export { SETUP_INSTRUCTIONS, PUBLIC_TESTS, ADMIN_TESTS, RESTOCK_TESTS, TESTING_WORKFLOW, QUICK_TEST_SCRIPTS };
