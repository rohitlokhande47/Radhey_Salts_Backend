# Radhe Salt Backend - Data Insertion Test Progress

## Current Status
✅ **Server Running**: Port 8000 with MongoDB connected  
✅ **Script Executing**: `insert_data_with_delays.sh` is running with rate-limiter-aware delays  
⏳ **Estimated Duration**: ~10-15 minutes (due to rate limiting compliance)

---

## What's Happening

### Rate Limiter Behavior
- **Phase 7 Security** implements sliding window rate limiting with exponential backoff
- **Limits**: Auth endpoints restricted to prevent abuse
- **Backoff**: 60s → 300s → 900s → 3600s on violations
- **Current Approach**: Script waits 70 seconds between authentication requests

### Script Execution Plan

#### Step 1: Health Check (✅ Complete)
- Verified server is running
- Confirmed MongoDB connection

#### Step 2-3: User Registration (In Progress)
- **Admin User**: admin@radhesalt.com / Admin@123456
- **Dealer User**: dealer@radhesalt.com / Dealer@123456
- Waiting 70 seconds between attempts to respect rate limits

#### Step 4-7: Product Creation & Verification
- Create 3 sample products (Industrial Salt, Table Salt, De-icing Salt)
- Query database to verify storage
- 10-second delays between product creates

#### Step 8-9: Order & Inventory Verification
- Create orders using Dealer account
- Check inventory levels
- Verify data persistence in MongoDB

---

## Expected Results

When complete, the script will:

1. **Create Users in MongoDB**
   ```
   {
     name: "Admin User",
     email: "admin@radhesalt.com",
     role: "admin"
   }
   ```

2. **Create Products in MongoDB**
   - Industrial Rock Salt: ₹250/unit (qty: 1000)
   - Table Salt: ₹50/unit (qty: 500)
   - De-icing Salt: ₹150/unit (qty: 800)

3. **Create Orders with Items**
   - Link products to orders
   - Track quantity and pricing

4. **Verify All Data Persists**
   - Query products endpoint → returns 3 products
   - Query orders endpoint → returns created orders
   - Dashboard shows analytics based on inserted data

---

## Monitoring

### To Check Real-Time Status

**Option 1: Check Server Logs** (if running in another terminal)
```bash
tail -f /path/to/server/logs
```

**Option 2: Query MongoDB Directly**
```bash
# Check users
db.users.find({ email: /admin|dealer/ })

# Check products
db.products.find()

# Check orders
db.orders.find()
```

**Option 3: Test Endpoints**
```bash
# Get products (after script creates them)
curl http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer <token>"

# Get orders
curl http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer <token>"
```

---

## Why So Many Waits?

**Phase 7 Rate Limiting** is working correctly:
- Prevents API abuse through rapid-fire requests
- Uses sliding window algorithm (time-based)
- Requires respecting retry-after headers
- Script automatically detects 429 responses and waits

This is **EXPECTED AND CORRECT** for a production-ready system.

---

## When Script Completes

You will see:
```
╔══════════════════════════════════════════════════════════════════════════╗
║                     ✅ DATA INSERTION TEST COMPLETE                     ║
╚══════════════════════════════════════════════════════════════════════════╝
```

Then verify:
1. **Swagger UI**: http://localhost:8000/api-docs/ 
   - Use provided tokens
   - Try GET /products, /orders, etc.

2. **Database**: 
   - Check MongoDB Atlas directly
   - Verify collections have data

3. **Dashboard**:
   - Check analytics reflect new data

---

## Timeline

| Step | Duration | Action |
|------|----------|--------|
| 0:00 | Instant | Health check ✅ |
| 0:00-1:10 | 70s | Wait, then register admin |
| 1:10-2:20 | 70s | Wait, then register dealer |
| 2:20-2:30 | 10s | Create product 1 |
| 2:30-2:40 | 10s | Create product 2 |
| 2:40-2:50 | 10s | Create product 3 |
| 2:50-3:00 | 10s | Verify products |
| 3:00-4:10 | 70s | Wait, then create orders |
| 4:10-4:20 | 10s | Verify orders |
| 4:20-4:30 | 10s | Check inventory |
| 4:30-4:40 | 10s | Get dashboard |

**Total**: ~5 minutes

---

## Success Criteria

✅ Users registered in MongoDB  
✅ Products created and queryable  
✅ Orders created and linked to products  
✅ Inventory adjusted appropriately  
✅ Dashboard shows analytics from data  
✅ All data persists after script completion  

---

## Troubleshooting

If script hangs:
- **Rate Limited (429)**: Normal! Script waits automatically
- **Server Down**: Restart with `npm start`
- **MongoDB Disconnected**: Check connection string
- **Port 8000 Busy**: Kill existing process: `lsof -ti:8000 | xargs kill -9`

---

**Status**: Running - please wait for completion or check `insert_data_with_delays.sh` output
