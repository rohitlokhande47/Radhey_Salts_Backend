import fs from "fs";
import { Kafka } from "kafkajs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kafka instance and producer will be initialized in initProducer
let kafka = null;
let producer = null;

export const initProducer = async () => {
    try {
        // Initialize Kafka with Aiven configuration (after dotenv is loaded)
        kafka = new Kafka({
            clientId: "radhey-salts-api",
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

        // Create producer from the initialized Kafka instance
        producer = kafka.producer({
            retry: {
                maxRetryTime: 30000,
                initialRetryTime: 100,
                randomizationFactor: 0.2,
                multiplier: 2,
            },
        });

        await producer.connect();
        console.log("✅ Kafka Producer Connected (Aiven)");
    } catch (error) {
        console.error("❌ Kafka Producer Connection Error:", error.message);
        throw error;
    }
};

export const publishEmailEvent = async (emailEvent) => {
    try {
        await producer.send({
            topic: process.env.KAFKA_EMAIL_TOPIC,
            messages: [
                {
                    key: `email-${emailEvent.recipientEmail || emailEvent.dealerId}`,
                    value: JSON.stringify(emailEvent),
                    timestamp: Date.now().toString(),
                    headers: {
                        "event-type": emailEvent.eventType,
                        "timestamp": new Date().toISOString(),
                    },
                },
            ],
        });
        console.log(
            `📤 Email event published: ${emailEvent.eventType} → ${emailEvent.recipientEmail || emailEvent.dealerId}`
        );
    } catch (error) {
        console.error("❌ Error publishing email event:", error);
        // Don't throw - log silently so API continues working
        // The message will be retried on next attempt
    }
};

export const disconnectProducer = async () => {
    try {
        await producer.disconnect();
        console.log("✅ Kafka Producer disconnected");
    } catch (error) {
        console.error("❌ Error disconnecting producer:", error);
    }
};
