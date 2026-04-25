import fs from "fs";
import { Kafka } from "kafkajs";
import { Admin } from "../models/admin.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";
import { sendEmail } from "./emailService.js";

// Kafka consumer will be initialized in startEmailConsumer
let kafka = null;
let consumer = null;

/**
 * Start the email consumer
 * Listens for email events from Kafka and processes them
 */
export const startEmailConsumer = async () => {
    try {
        // Initialize Kafka with Aiven configuration (after dotenv is loaded)
        kafka = new Kafka({
            clientId: "radhey-salts-email-consumer",
            brokers: process.env.KAFKA_BROKERS.split(","),
            ssl: {
                rejectUnauthorized: true,
                ca: [fs.readFileSync(process.env.KAFKA_CA_CERT_PATH, "utf-8")],
                key: fs.readFileSync(process.env.KAFKA_KEY_PATH, "utf-8"),
                cert: fs.readFileSync(process.env.KAFKA_CERT_PATH, "utf-8"),
            },
            sasl: {
                mechanism: "scram-sha-256",
                username: process.env.KAFKA_USERNAME,
                password: process.env.KAFKA_PASSWORD,
            },
        });

        // Create consumer from initialized Kafka instance
        consumer = kafka.consumer({
            groupId: "email-notification-group",
            sessionTimeout: 30000,
            heartbeatInterval: 10000,
        });

        await consumer.connect();
        console.log("✅ Kafka Consumer Connected (Aiven)");

        await consumer.subscribe({ topic: process.env.KAFKA_EMAIL_TOPIC });
        console.log(`📨 Subscribed to topic: ${process.env.KAFKA_EMAIL_TOPIC}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString());
                    console.log(
                        `\n📨 Processing email event: ${event.eventType} (Partition: ${partition})`
                    );

                    // Route to appropriate handler based on event type
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
                    console.error("❌ Error processing message:", error.message);
                }
            },
        });

        console.log("✅ Email Consumer Started Successfully");
        console.log("👂 Listening for email events...\n");
    } catch (error) {
        console.error("❌ Email Consumer Error:", error);
        process.exit(1);
    }
};

/**
 * Handle ORDER_PLACED event
 * Sends order confirmation email to dealer
 */
const handleOrderPlaced = async (event) => {
    try {
        const order = event.order || (await Orders.findById(event.orderId));
        const dealer = await Dealer.findById(event.dealerId);

        if (!dealer) {
            console.error(`❌ Dealer not found: ${event.dealerId}`);
            return;
        }

        // Enrich order with product names
        if (order.items && Array.isArray(order.items)) {
            for (let item of order.items) {
                if (!item.productName && item.productId) {
                    const product = await Product.findById(item.productId);
                    item.productName = product?.name || "Unknown Product";
                }
            }
        }

        const result = await sendEmail(dealer.email, "ORDER_PLACED", {
            order,
            dealer,
        });

        if (result.success) {
            console.log(`✅ Order confirmation email sent to ${dealer.email}`);
        } else {
            console.error(`❌ Failed to send email: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error handling ORDER_PLACED:", error.message);
    }
};

/**
 * Handle ORDER_DISPATCHED event
 * Sends dispatch notification email to dealer
 */
const handleOrderDispatched = async (event) => {
    try {
        const order = event.order || (await Orders.findById(event.orderId));
        const dealer = await Dealer.findById(event.dealerId);

        if (!dealer) {
            console.error(`❌ Dealer not found: ${event.dealerId}`);
            return;
        }

        const result = await sendEmail(dealer.email, "ORDER_DISPATCHED", {
            order,
            dealer,
        });

        if (result.success) {
            console.log(`✅ Dispatch notification sent to ${dealer.email}`);
        } else {
            console.error(`❌ Failed to send email: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error handling ORDER_DISPATCHED:", error.message);
    }
};

/**
 * Handle ORDER_DELIVERED event
 * Sends delivery confirmation email to dealer
 */
const handleOrderDelivered = async (event) => {
    try {
        const order = event.order || (await Orders.findById(event.orderId));
        const dealer = await Dealer.findById(event.dealerId);

        if (!dealer) {
            console.error(`❌ Dealer not found: ${event.dealerId}`);
            return;
        }

        const result = await sendEmail(dealer.email, "ORDER_DELIVERED", {
            order,
            dealer,
        });

        if (result.success) {
            console.log(`✅ Delivery confirmation sent to ${dealer.email}`);
        } else {
            console.error(`❌ Failed to send email: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error handling ORDER_DELIVERED:", error.message);
    }
};

/**
 * Handle PAYMENT_CONFIRMED event
 * Sends payment confirmation email to dealer
 */
const handlePaymentConfirmed = async (event) => {
    try {
        const order = event.order || (await Orders.findById(event.orderId));
        const dealer = await Dealer.findById(event.dealerId);

        if (!dealer) {
            console.error(`❌ Dealer not found: ${event.dealerId}`);
            return;
        }

        const result = await sendEmail(dealer.email, "PAYMENT_CONFIRMED", {
            order,
            dealer,
        });

        if (result.success) {
            console.log(`✅ Payment confirmation sent to ${dealer.email}`);
        } else {
            console.error(`❌ Failed to send email: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error handling PAYMENT_CONFIRMED:", error.message);
    }
};

/**
 * Handle LOW_STOCK_ALERT event
 * Sends low stock alerts to all active admins
 */
const handleLowStockAlert = async (event) => {
    try {
        const product = event.product || (await Product.findById(event.productId));

        if (!product) {
            console.error(`❌ Product not found: ${event.productId}`);
            return;
        }

        // Send alert to all active admins
        const admins = await Admin.find({ isActive: true });

        if (admins.length === 0) {
            console.warn("⚠️ No active admins found for low stock alert");
            return;
        }

        console.log(`📧 Sending low stock alert to ${admins.length} admin(s)`);

        for (const admin of admins) {
            const result = await sendEmail(admin.email, "LOW_STOCK_ALERT", {
                product,
                admin,
            });

            if (result.success) {
                console.log(`✅ Low stock alert sent to ${admin.email}`);
            } else {
                console.error(`❌ Failed to send alert: ${result.error}`);
            }
        }
    } catch (error) {
        console.error("❌ Error handling LOW_STOCK_ALERT:", error.message);
    }
};

/**
 * Gracefully stop the consumer
 */
export const stopEmailConsumer = async () => {
    try {
        await consumer.disconnect();
        console.log("✅ Email Consumer stopped gracefully");
    } catch (error) {
        console.error("❌ Error stopping consumer:", error);
    }
};
