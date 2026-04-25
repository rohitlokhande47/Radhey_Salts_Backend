# 📧 Kafka Email Notifications - Implementation Complete

## ✅ What's Been Implemented

Your Radhey Salts Backend now has **production-ready Kafka email notifications** using:
- **Kafka Broker**: Aiven (free tier available)
- **Email Service**: SendGrid (100 free emails/day)

---

## 🎯 Email Events Implemented

| Event | When | Recipient | Status |
|-------|------|-----------|--------|
| **ORDER_PLACED** | When dealer places order | Dealer | ✅ Implemented |
| **ORDER_DISPATCHED** | When admin updates status to "dispatched" | Dealer | ✅ Implemented |
| **ORDER_DELIVERED** | When admin updates status to "delivered" | Dealer | ✅ Implemented |
| **PAYMENT_CONFIRMED** | When payment status is marked "completed" | Dealer | ✅ Implemented |
| **LOW_STOCK_ALERT** | When product stock falls below reorder level | All Admins | ⚠️ Ready (manual trigger) |

---

## 📋 Files Created

### **Core Kafka Services:**
1. **`src/services/kafkaProducer.js`** - Publishes email events to Kafka (Aiven)
2. **`src/services/emailService.js`** - Professional HTML email templates (SendGrid)
3. **`src/services/emailConsumer.js`** - Consumes Kafka events and sends emails
4. **`src/consumer.js`** - Consumer entry point (separate process)

### **Updated Files:**
5. **`src/controllers/order.controller.js`** - Added publishEmailEvent calls
6. **`src/index.js`** - Initialize Kafka producer on startup
7. **`package.json`** - Added kafkajs, @sendgrid/mail, concurrently

### **Configuration:**
8. **`.env.example`** - Template for all required environment variables

---

## 🚀 Setup Instructions

### **STEP 1: Create Aiven Kafka Account (Free)**

1. Go to https://aiven.io → Sign up (free account)
2. Create a project
3. Create Kafka service on free tier:
   - Click "Create Service"
   - Select "Kafka"
   - Choose "Free" tier
   - Select region closest to you
   - Click "Create"

4. Wait for service to be ready (3-5 minutes)

5. Download SSL certificates:
   - Go to service dashboard
   - Click "Client" in sidebar
   - Download:
     - `ca.pem` → Save to `config/certs/ca.pem`
     - `service.key` → Save to `config/certs/service.key`
     - `service.crt` → Save to `config/certs/service.crt`

6. Copy connection details:
   - Get "Kafka Service URL" (broker addresses)
   - Get "Username" (avnadmin)
   - Get "Password"

7. Create Kafka Topic:
   - Click "Topics" tab
   - Click "Create Topic"
   - Name: `email-notifications`
   - Partitions: `1`
   - Replication factor: `1`
   - Click "Create"

---

### **STEP 2: Create SendGrid Account (Free 100/day)**

1. Go to https://sendgrid.com → Sign up (free account)
2. Verify your email
3. Create API Key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Radhey Salts Backend"
   - Select "Restricted Access"
   - Permissions: Mail Send (Full Access)
   - Click "Create & View"
   - Copy the key (you won't see it again!)

4. Verify Sender Email:
   - Go to Settings → Sender Authentication
   - Click "Create New Sender"
   - Enter: `noreply@radhey-salts.com` (or your domain)
   - Verify email
   - Use this in `.env` as `SEND_FROM_EMAIL`

---

### **STEP 3: Create Certificates Directory**

```bash
mkdir -p config/certs
```

Then place your downloaded Aiven certificates:
- `config/certs/ca.pem`
- `config/certs/service.key`
- `config/certs/service.crt`

---

### **STEP 4: Update Environment Variables**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Aiven Kafka (from dashboard)
KAFKA_BROKERS=kafka-xxx.aivencloud.com:9093
KAFKA_USERNAME=avnadmin
KAFKA_PASSWORD=your_password_here
KAFKA_EMAIL_TOPIC=email-notifications

# SSL Certificate paths
KAFKA_CA_CERT_PATH=./config/certs/ca.pem
KAFKA_KEY_PATH=./config/certs/service.key
KAFKA_CERT_PATH=./config/certs/service.crt

# SendGrid (from API key page)
SENDGRID_API_KEY=SG.your_api_key_here
SEND_FROM_EMAIL=noreply@radhey-salts.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

---

### **STEP 5: Install Dependencies**

```bash
npm install
```

This installs:
- `kafkajs@2.2.4` - Kafka client
- `@sendgrid/mail@7.7.0` - SendGrid email API
- `concurrently@8.2.0` - Run multiple processes

---

### **STEP 6: Run API + Consumer Together**

**Option 1: Run Both in One Command (Recommended)**
```bash
npm run dev-all
```

This starts:
- API Server on http://localhost:8000
- Email Consumer listening for events

**Option 2: Run Separately (If debugging)**

Terminal 1 - API:
```bash
npm run dev
```

Terminal 2 - Consumer:
```bash
npm run consumer
```

---

## 🧪 Test the Email Notification

### **Test 1: Place an Order**

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "PRODUCT_ID", "quantity": 100}],
    "deliveryAddress": "123 Main Street, City"
  }'
```

**Expected Output:**

API Terminal:
```
📤 Email event published: ORDER_PLACED → dealer@email.com
```

Consumer Terminal:
```
📨 Processing email event: ORDER_PLACED
✅ Email sent successfully to dealer@email.com (ORDER_PLACED)
```

Dealer's Email:
```
Receives: "🎉 Order Confirmed! - [order reference]"
```

---

### **Test 2: Update Order Status to Dispatched**

```bash
curl -X PUT http://localhost:8000/api/v1/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderStatus": "dispatched"}'
```

**Expected Output:**

Consumer Terminal:
```
📨 Processing email event: ORDER_DISPATCHED
✅ Email sent successfully to dealer@email.com (ORDER_DISPATCHED)
```

---

### **Test 3: Update Order Status to Delivered**

```bash
curl -X PUT http://localhost:8000/api/v1/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderStatus": "delivered"}'
```

**Expected Output:**

Consumer Terminal:
```
📨 Processing email event: ORDER_DELIVERED
✅ Email sent successfully to dealer@email.com (ORDER_DELIVERED)
```

---

### **Test 4: Update Payment Status**

```bash
curl -X PUT http://localhost:8000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus": "completed", "amountPaid": 5000}'
```

**Expected Output:**

Consumer Terminal:
```
📨 Processing email event: PAYMENT_CONFIRMED
✅ Email sent successfully to dealer@email.com (PAYMENT_CONFIRMED)
```

---

## 🏗️ Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        API SERVER (Node.js)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Dealer places order                                          │
│     POST /api/v1/orders                                          │
│                  ↓                                               │
│  2. Save to MongoDB (fast - <100ms)                              │
│     + Update inventory                                           │
│                  ↓                                               │
│  3. Publish to Kafka (async - non-blocking)                      │
│     publishEmailEvent({ eventType: "ORDER_PLACED" })             │
│                  ↓                                               │
│  4. Return 201 Response ⚡ (API completes instantly)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│              AIVEN KAFKA MESSAGE QUEUE (Cloud)                   │
│                 Topic: email-notifications                       │
│                 Messages queued and durable                      │
│         (Safe even if Consumer is down)                          │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                   EMAIL CONSUMER (Node.js)                       │
│                  (Separate Process)                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Listen for events from Kafka                                 │
│  2. Fetch dealer/admin info from MongoDB                         │
│  3. Render HTML email template                                   │
│  4. Send via SendGrid API                                        │
│  5. Log result                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                    SENDGRID EMAIL SERVICE                        │
│                    (Email Delivery)                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Email delivered to dealer's inbox                              │
│  With professional HTML formatting                              │
│  Tracking links and order details                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What Happens When Systems Fail

### **If Consumer is Down:**
- ✅ Messages stay in Kafka queue
- ✅ When consumer restarts, it processes all queued messages
- ✅ Emails sent (might be delayed, but reliable)

### **If SendGrid is Down:**
- ⚠️ Email send fails (logged)
- ⚠️ Message removed from queue
- Solution: Implement retry logic (add in next phase)

### **If Kafka Connection Fails:**
- ⚠️ publishEmailEvent() logs silently
- ✅ API continues to work (non-blocking)
- ⚠️ Emails won't be sent until Kafka reconnects

---

## 📊 Monitoring & Debugging

### **Check Consumer Logs:**
```bash
# Look for these messages:
✅ Kafka Consumer Connected (Aiven)
✅ Email Consumer Started Successfully
👂 Listening for email events...

# When events are processed:
📨 Processing email event: ORDER_PLACED
✅ Email sent successfully to dealer@email.com
```

### **Check Aiven Dashboard:**
1. Go to your Kafka service
2. Click "Metrics" tab
3. View messages produced/consumed
4. Monitor topic: `email-notifications`

### **Check SendGrid Statistics:**
1. Go to https://app.sendgrid.com/
2. Click "Analytics"
3. View emails sent, opened, clicked, bounced

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Cannot find module 'kafkajs'**
```bash
npm install kafkajs @sendgrid/mail concurrently
npm install --save-dev concurrently
```

### **Issue 2: "SSL certificate verification failed"**
- Ensure certificate files exist in `config/certs/`
- Check `KAFKA_CA_CERT_PATH`, `KAFKA_KEY_PATH`, `KAFKA_CERT_PATH` in .env
- Verify paths are correct (use absolute or relative from project root)

### **Issue 3: "KAFKA_TOPIC is undefined"**
- Check `.env` file has `KAFKA_EMAIL_TOPIC=email-notifications`
- Ensure the topic exists in Aiven dashboard
- Restart consumer after updating .env

### **Issue 4: "SendGrid API error: 401 Unauthorized"**
- Verify `SENDGRID_API_KEY` is correct
- Check API key hasn't expired
- Verify `SEND_FROM_EMAIL` is verified in SendGrid

### **Issue 5: "Port 8000 already in use"**
- Change PORT in .env:
  ```env
  PORT=8001
  ```

---

## 📈 Scaling Considerations

### **Current Setup (Free Tier):**
- ✅ 10,000 Kafka messages/month (Aiven free)
- ✅ 100 emails/day (SendGrid free)
- ✅ Single consumer process
- ✅ Production-ready for small-medium volume

### **When to Scale:**
- **More than 100 orders/day**: Upgrade SendGrid ($19.95/month)
- **More than 10,000 messages/month**: Upgrade Aiven ($25/month)
- **High latency**: Add multiple consumer processes
- **Higher reliability**: Implement message retry logic

---

## ✅ Verification Checklist

- [ ] Created Aiven Kafka account and cluster
- [ ] Created `email-notifications` topic in Aiven
- [ ] Downloaded SSL certificates to `config/certs/`
- [ ] Created SendGrid account and API key
- [ ] Verified sender email in SendGrid
- [ ] Updated `.env` with all credentials
- [ ] Ran `npm install`
- [ ] Started server with `npm run dev-all`
- [ ] Tested order placement
- [ ] Received confirmation email
- [ ] Checked consumer logs

---

## 📧 Email Templates

All templates are in `src/services/emailService.js` with:
- ✅ Professional HTML styling
- ✅ Order details and tracking links
- ✅ Company branding
- ✅ Clear call-to-action buttons
- ✅ Responsive design

Available templates:
1. **ORDER_PLACED** - Order confirmation
2. **ORDER_DISPATCHED** - Shipment notification
3. **ORDER_DELIVERED** - Delivery confirmation
4. **PAYMENT_CONFIRMED** - Payment receipt
5. **LOW_STOCK_ALERT** - Inventory alert (for admins)

---

## 🎊 You're All Set!

Your email notification system is **production-ready**! 🚀

**What works:**
- ✅ Async, non-blocking email sending
- ✅ Professional HTML emails
- ✅ Reliable message delivery via Kafka
- ✅ Free tier suitable for launch
- ✅ Scalable architecture for growth

**Next Steps:**
1. Test with real orders
2. Monitor SendGrid analytics
3. Add retry logic when volume increases
4. Consider adding SMS notifications
5. Build frontend to use the API

---

## 📞 Support

For issues:
1. Check `.env` configuration
2. Review consumer logs
3. Check Aiven dashboard for connection status
4. Verify SendGrid API key
5. Check certificate paths

Happy emailing! 📧✨
