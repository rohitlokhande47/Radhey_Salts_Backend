# 📧 Kafka Email Notifications - Complete Setup Guide

## 🎯 What Can Be Done

With Kafka + Email Integration, you can:

1. ✅ Send order confirmation emails asynchronously
2. ✅ Send payment confirmation emails
3. ✅ Send order status update emails (dispatched, delivered)
4. ✅ Send low stock alerts to admins
5. ✅ Send daily sales reports
6. ✅ Send password reset emails
7. ✅ Send admin notifications for large orders
8. ✅ All WITHOUT blocking the API response

---

## 📋 Prerequisites

- **Node.js** (already have)
- **Kafka** (free - Upstash or self-hosted)
- **Email Service** (free - SendGrid or Gmail)
- **MongoDB** (already have)

---

## 🚀 STEP 1: Install Dependencies

```bash
npm install kafkajs @sendgrid/mail nodemailer
```

**What each does:**
- `kafkajs` - Kafka client
- `@sendgrid/mail` - SendGrid email API
- `nodemailer` - Alternative email service (Gmail SMTP)

---

## 🔑 STEP 2: Set Up Free Email Service

### **Option A: SendGrid (Recommended - Free 100/day)**

1. Go to https://sendgrid.com → Sign up (free)
2. Create API key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY=SG.xxx_your_api_key_xxx
   SEND_FROM_EMAIL=noreply@radhey-salts.com
   ```

### **Option B: Gmail (Free - Unlimited*)**

1. Enable 2FA on Gmail
2. Create app password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SEND_FROM_EMAIL=your-email@gmail.com
   ```

*Limited by Gmail rate limits

---

## 🔌 STEP 3: Set Up Kafka Broker

### **Option A: Upstash Kafka (Easiest - Free 10,000 msgs/month)**

1. Go to https://upstash.com → Sign up (free)
2. Click "Create Kafka Cluster"
3. Select "Free" plan
4. Create cluster
5. Create topic: `email-notifications`
6. Copy credentials to `.env`:
   ```env
   KAFKA_BROKER=xxxx-xxxxx.upstash.io
   KAFKA_USERNAME=your_username
   KAFKA_PASSWORD=your_password
   KAFKA_TOPIC=email-notifications
   ```

### **Option B: Local Kafka (Docker)**

```bash
# Using Docker Compose
docker-compose up -d
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
```

Add to `.env`:
```env
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=email-notifications
```

---

## 💻 STEP 4: Create Kafka Producer Service

Create `src/services/kafkaProducer.js`:

```javascript
import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "radhey-salts-api",
    brokers: [process.env.KAFKA_BROKER],
    ...(process.env.KAFKA_USERNAME && {
        sasl: {
            mechanism: "scram-sha-256",
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
        ssl: true,
    }),
});

const producer = kafka.producer();

export const initProducer = async () => {
    try {
        await producer.connect();
        console.log("✅ Kafka Producer Connected");
    } catch (error) {
        console.error("❌ Kafka Producer Error:", error);
        process.exit(1);
    }
};

export const publishEmailEvent = async (emailEvent) => {
    try {
        await producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [
                {
                    key: `email-${emailEvent.recipientEmail}`,
                    value: JSON.stringify(emailEvent),
                    timestamp: Date.now().toString(),
                },
            ],
        });
        console.log(
            `📤 Email event published: ${emailEvent.eventType} → ${emailEvent.recipientEmail}`
        );
    } catch (error) {
        console.error("❌ Error publishing email event:", error);
        // Don't throw - log silently so API continues
    }
};

export const disconnectProducer = async () => {
    await producer.disconnect();
};
```

---

## 📧 STEP 5: Create Email Service

Create `src/services/emailService.js`:

```javascript
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates
const emailTemplates = {
    ORDER_PLACED: (order, dealer) => ({
        subject: `Order Confirmation - ${order.orderRef}`,
        html: `
            <h2>🎉 Order Confirmed!</h2>
            <p>Hi ${dealer.name},</p>
            <p>Your order has been successfully placed.</p>
            <br/>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <tr style="background: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${order.orderRef}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">₹${order.totalAmount}</td>
                </tr>
                <tr style="background: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${order.items.length} products</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Pending Confirmation</td>
                </tr>
            </table>
            <br/>
            <p>Track your order: <a href="https://yourapp.com/orders/${order._id}">View Order</a></p>
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        `,
    }),

    ORDER_DISPATCHED: (order, dealer) => ({
        subject: `Order Dispatched - ${order.orderRef}`,
        html: `
            <h2>📦 Order Dispatched!</h2>
            <p>Hi ${dealer.name},</p>
            <p>Your order ${order.orderRef} has been dispatched.</p>
            <p><strong>Tracking:</strong> ${order.trackingNumber || "Coming soon"}</p>
            <p><a href="https://yourapp.com/orders/${order._id}">Track Order</a></p>
        `,
    }),

    ORDER_DELIVERED: (order, dealer) => ({
        subject: `Order Delivered - ${order.orderRef}`,
        html: `
            <h2>✅ Order Delivered!</h2>
            <p>Hi ${dealer.name},</p>
            <p>Your order ${order.orderRef} has been delivered.</p>
            <p><a href="https://yourapp.com/orders/${order._id}">View Order</a></p>
        `,
    }),

    PAYMENT_CONFIRMED: (order, dealer) => ({
        subject: `Payment Confirmed - ${order.orderRef}`,
        html: `
            <h2>💳 Payment Confirmed!</h2>
            <p>Hi ${dealer.name},</p>
            <p>Payment of ₹${order.totalAmount} for order ${order.orderRef} has been confirmed.</p>
            <p>Thank you!</p>
        `,
    }),

    LOW_STOCK_ALERT: (product, admin) => ({
        subject: `⚠️ Low Stock Alert - ${product.name}`,
        html: `
            <h2>Low Stock Alert</h2>
            <p>Hi ${admin.name},</p>
            <p>Product <strong>${product.name}</strong> is running low on stock.</p>
            <p><strong>Current Stock:</strong> ${product.stockQty} units</p>
            <p><strong>Reorder Level:</strong> ${product.reorderLevel} units</p>
            <p><a href="https://yourapp.com/admin/inventory">Manage Inventory</a></p>
        `,
    }),
};

export const sendEmail = async (recipientEmail, eventType, data) => {
    try {
        const template = emailTemplates[eventType];
        if (!template) {
            throw new Error(`Email template not found: ${eventType}`);
        }

        const emailContent = template(data.order || data.product, data.dealer || data.admin);

        const msg = {
            to: recipientEmail,
            from: process.env.SEND_FROM_EMAIL,
            subject: emailContent.subject,
            html: emailContent.html,
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent to ${recipientEmail} (${eventType})`);
        return { success: true };
    } catch (error) {
        console.error("❌ Email send error:", error);
        return { success: false, error: error.message };
    }
};
```

---

## 🧠 STEP 6: Create Email Consumer

Create `src/services/emailConsumer.js`:

```javascript
import { Kafka } from "kafkajs";
import { sendEmail } from "./emailService.js";
import { Dealer } from "../models/dealer.model.js";
import { Admin } from "../models/admin.model.js";

const kafka = new Kafka({
    clientId: "radhey-salts-email-consumer",
    brokers: [process.env.KAFKA_BROKER],
    ...(process.env.KAFKA_USERNAME && {
        sasl: {
            mechanism: "scram-sha-256",
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
        ssl: true,
    }),
});

const consumer = kafka.consumer({ groupId: "email-notification-group" });

export const startEmailConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: process.env.KAFKA_TOPIC });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString());
                    console.log(`📨 Processing email event: ${event.eventType}`);

                    // Route to appropriate handler
                    switch (event.eventType) {
                        case "ORDER_PLACED":
                            await handleOrderPlaced(event);
                            break;
                        case "ORDER_DISPATCHED":
                            await handleOrderDispatched(event);
                            break;
                        case "ORDER_DELIVERED":
                            await handleOrderDelivered(event);
                            break;
                        case "PAYMENT_CONFIRMED":
                            await handlePaymentConfirmed(event);
                            break;
                        case "LOW_STOCK_ALERT":
                            await handleLowStockAlert(event);
                            break;
                        default:
                            console.log(`⚠️ Unknown event type: ${event.eventType}`);
                    }
                } catch (error) {
                    console.error("❌ Message processing error:", error);
                }
            },
        });

        console.log("✅ Email Consumer Started Successfully");
    } catch (error) {
        console.error("❌ Email Consumer Error:", error);
        process.exit(1);
    }
};

// Event handlers
const handleOrderPlaced = async (event) => {
    const dealer = await Dealer.findById(event.dealerId);
    if (dealer) {
        await sendEmail(dealer.email, "ORDER_PLACED", {
            order: event.order,
            dealer,
        });
    }
};

const handleOrderDispatched = async (event) => {
    const dealer = await Dealer.findById(event.dealerId);
    if (dealer) {
        await sendEmail(dealer.email, "ORDER_DISPATCHED", {
            order: event.order,
            dealer,
        });
    }
};

const handleOrderDelivered = async (event) => {
    const dealer = await Dealer.findById(event.dealerId);
    if (dealer) {
        await sendEmail(dealer.email, "ORDER_DELIVERED", {
            order: event.order,
            dealer,
        });
    }
};

const handlePaymentConfirmed = async (event) => {
    const dealer = await Dealer.findById(event.dealerId);
    if (dealer) {
        await sendEmail(dealer.email, "PAYMENT_CONFIRMED", {
            order: event.order,
            dealer,
        });
    }
};

const handleLowStockAlert = async (event) => {
    // Send to all admins
    const admins = await Admin.find({ isActive: true });
    for (const admin of admins) {
        await sendEmail(admin.email, "LOW_STOCK_ALERT", {
            product: event.product,
            admin,
        });
    }
};

export const stopEmailConsumer = async () => {
    await consumer.disconnect();
};
```

---

## 🔗 STEP 7: Update Order Controller

In `src/controllers/order.controller.js`, modify `placeOrder`:

```javascript
import { publishEmailEvent } from "../services/kafkaProducer.js";

export const placeOrder = asyncHandler(async (req, res) => {
    const { items, deliveryAddress } = req.body;
    const dealerId = req.user.id;

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        // Check minimum order quantity
        if (item.quantity < product.MOQ) {
            throw new ApiError(
                400,
                `Minimum order quantity for ${product.name} is ${product.MOQ}`
            );
        }

        // Check stock
        if (product.stockQty < item.quantity) {
            throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }

        // Calculate price
        const price = product.getPriceForQuantity(item.quantity);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
            productId: product._id,
            quantity: item.quantity,
            unitPrice: price,
            total: itemTotal,
        });
    }

    // Create order
    const order = await Orders.create({
        dealerId,
        items: orderItems,
        totalAmount,
        orderStatus: "pending",
        paymentStatus: "pending",
        deliveryAddress,
    });

    // Update inventory
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQty: -item.quantity } },
            { new: true }
        );

        // Create inventory ledger entry
        await InventoryLedger.create({
            productId: item.productId,
            changeType: "debit",
            quantityChanged: item.quantity,
            reason: "order_placed",
            triggeredBy: dealerId,
            triggeredByType: "dealer",
        });
    }

    // 📤 PUBLISH EMAIL EVENT TO KAFKA (non-blocking)
    await publishEmailEvent({
        eventType: "ORDER_PLACED",
        dealerId: order.dealerId,
        order: order.toObject(),
    });

    // Audit log
    await AuditLog.create({
        actorId: dealerId,
        actorRole: "dealer",
        action: "order_placed",
        targetCollection: "orders",
        targetId: order._id,
        status: "success",
    });

    return res.status(201).json(
        new ApiResponse(201, order, "Order placed successfully")
    );
});
```

---

## ✏️ STEP 8: Update Order Status Endpoint

In `src/controllers/order.controller.js`, modify `updateOrderStatus`:

```javascript
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    const order = await Orders.findByIdAndUpdate(
        orderId,
        { orderStatus: newStatus },
        { new: true }
    );

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // 📤 PUBLISH EMAIL EVENT
    if (newStatus === "dispatched") {
        await publishEmailEvent({
            eventType: "ORDER_DISPATCHED",
            dealerId: order.dealerId,
            order: order.toObject(),
        });
    } else if (newStatus === "delivered") {
        await publishEmailEvent({
            eventType: "ORDER_DELIVERED",
            dealerId: order.dealerId,
            order: order.toObject(),
        });
    }

    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated")
    );
});
```

---

## 🚀 STEP 9: Initialize Producer in Main Server

Update `src/index.js`:

```javascript
import { initProducer, disconnectProducer } from "./services/kafkaProducer.js";

// After DB connection
await connectDB();
await initProducer(); // Initialize Kafka producer

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Kafka Producer initialized`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await disconnectProducer();
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});
```

---

## 👂 STEP 10: Create Consumer Entry Point

Create `src/consumer.js`:

```javascript
import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { startEmailConsumer, stopEmailConsumer } from "./services/emailConsumer.js";

dotenv.config();

const startConsumer = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await connectDB();
        console.log("✅ MongoDB connected");

        console.log("👂 Starting Email Consumer...");
        await startEmailConsumer();

        console.log("\n✅ Email Consumer is running...");
        console.log("Waiting for messages...\n");
    } catch (error) {
        console.error("❌ Consumer startup error:", error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down consumer...");
    await stopEmailConsumer();
    console.log("✅ Consumer stopped");
    process.exit(0);
});

startConsumer();
```

---

## 📦 STEP 11: Update package.json

Add scripts:

```json
{
    "scripts": {
        "dev": "node src/index.js",
        "consumer": "node src/consumer.js",
        "dev-all": "concurrently \"npm run dev\" \"npm run consumer\"",
        "start": "node src/index.js"
    }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

---

## 📝 STEP 12: Update .env File

```env
# Kafka Configuration
KAFKA_BROKER=your_kafka_broker_url
KAFKA_USERNAME=your_username
KAFKA_PASSWORD=your_password
KAFKA_TOPIC=email-notifications

# Email Configuration (Choose one)
# SendGrid
SENDGRID_API_KEY=SG.your_api_key
SEND_FROM_EMAIL=noreply@radhey-salts.com

# Or Gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
# SEND_FROM_EMAIL=your-email@gmail.com
```

---

## 🏃 STEP 13: Run Everything

### **Option 1: Run API + Consumer Together**
```bash
npm run dev-all
```

### **Option 2: Run Separately**

**Terminal 1 - API Server:**
```bash
npm run dev
```

Output:
```
✅ MongoDB connected
✅ Kafka Producer Connected
🚀 Server running on port 8000
```

**Terminal 2 - Email Consumer:**
```bash
npm run consumer
```

Output:
```
✅ MongoDB connected
👂 Starting Email Consumer...
✅ Email Consumer is running...
Waiting for messages...
```

---

## 🧪 STEP 14: Test Email Notifications

### **Test 1: Place an Order**

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "PRODUCT_ID", "quantity": 100}],
    "deliveryAddress": "123 Main St"
  }'
```

**In API Terminal:**
```
📤 Email event published: ORDER_PLACED → dealer@email.com
```

**In Consumer Terminal:**
```
📨 Processing email event: ORDER_PLACED
✅ Email sent to dealer@email.com (ORDER_PLACED)
```

### **Test 2: Update Order Status**

```bash
curl -X PUT http://localhost:8000/api/v1/orders/ORDER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newStatus": "dispatched"}'
```

**In Consumer Terminal:**
```
📨 Processing email event: ORDER_DISPATCHED
✅ Email sent to dealer@email.com (ORDER_DISPATCHED)
```

---

## 🎯 What Happens After Setup

```
User Places Order
    ↓
API validates & saves order (fast - <100ms)
    ↓
API publishes EMAIL_EVENT to Kafka (async)
    ↓
API returns 201 response immediately ⚡
    ↓
Consumer picks up event (could be seconds/minutes later)
    ↓
Consumer sends email to dealer
    ↓
Dealer receives confirmation email 📧
```

---

## 📊 Benefits Achieved

| Benefit | Result |
|---------|--------|
| **Non-blocking** | API returns in <100ms |
| **Reliable** | If email service down, queued in Kafka |
| **Scalable** | Can add more consumers anytime |
| **Decoupled** | Email service separate from API |
| **Free** | 10,000 msgs/month + 100 emails/day |

---

## ✅ Checklist

- [ ] Install dependencies (`npm install kafkajs @sendgrid/mail`)
- [ ] Create Upstash Kafka account and topic
- [ ] Create SendGrid account and API key
- [ ] Update `.env` with credentials
- [ ] Create `src/services/kafkaProducer.js`
- [ ] Create `src/services/emailService.js`
- [ ] Create `src/services/emailConsumer.js`
- [ ] Create `src/consumer.js`
- [ ] Update `src/controllers/order.controller.js`
- [ ] Update `src/index.js`
- [ ] Update `package.json` scripts
- [ ] Test with API call
- [ ] Check consumer logs

---

## 🚀 You're All Set!

Your Radhey Salts Backend now has **production-ready email notifications via Kafka**! 🎉

Need help with any step? Let me know!
