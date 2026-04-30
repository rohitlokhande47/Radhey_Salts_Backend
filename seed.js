import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./src/constants.js";
import { Admin } from "./src/models/admin.model.js";
import { AuditLog } from "./src/models/auditLog.model.js";
import { DailySnapshot } from "./src/models/dailySnapshots.model.js";
import { Dealer } from "./src/models/dealer.model.js";
import { InventoryLedger } from "./src/models/inventoryLedger.model.js";
import { Order } from "./src/models/orders.model.js";
import { Product } from "./src/models/product.model.js";
import { TokenBlacklist } from "./src/models/tokenBlacklist.model.js";

dotenv.config({
    path: "./.env",
});

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
        console.log(`✅ MongoDB Connected! DB Host: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.log("❌ MongoDB Connection Error: ", error);
        process.exit(1);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

const generateDummyAdmins = () => [
    {
        name: "Rajesh Kumar",
        email: "admin@radhey.com",
        password: "Admin@123",
        role: "super_admin",
        isActive: true,
        permissions: ["all"],
    },
    {
        name: "Priya Singh",
        email: "manager@radhey.com",
        password: "Manager@123",
        role: "admin",
        isActive: true,
        permissions: ["products", "orders", "inventory"],
    },
];

const generateDummyDealers = () => [
    {
        name: "Amit Patel",
        email: "amit.patel@dealer.com",
        phone: "9876543210",
        password: "Dealer@123",
        businessName: "Patel Salt Trading",
        address: "123 Market Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        role: "dealer",
        status: "active",
        creditLimit: 500000,
        outstandingBalance: 0,
    },
    {
        name: "Sharma Brothers",
        email: "sharma@dealer.com",
        phone: "9876543211",
        password: "Dealer@123",
        businessName: "Sharma & Co.",
        address: "456 Trade Centre",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        role: "dealer",
        status: "active",
        creditLimit: 750000,
        outstandingBalance: 0,
    },
    {
        name: "Rajesh Gupta",
        email: "rajesh.gupta@dealer.com",
        phone: "9876543212",
        password: "Dealer@123",
        businessName: "Gupta Enterprises",
        address: "789 Business Hub",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        role: "dealer",
        status: "active",
        creditLimit: 600000,
        outstandingBalance: 0,
    },
    {
        name: "Priya Verma",
        email: "priya.verma@dealer.com",
        phone: "9876543213",
        password: "Dealer@123",
        businessName: "Verma Wholesale",
        address: "321 Commerce Plaza",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        role: "dealer",
        status: "active",
        creditLimit: 550000,
        outstandingBalance: 0,
    },
];

const generateDummyProducts = () => [
    {
        name: "Rock Salt - Industrial Grade",
        description: "High-quality industrial rock salt for de-icing and chemical industries",
        productCode: "ROCK-001",
        category: "Industrial Salt",
        price: 250,
        MOQ: 50,
        stockQty: 5000,
        reorderLevel: 500,
        unit: "kg",
        supplier: "Local Mines Ltd",
        hsn: "2501",
        isActive: true,
        pricingTiers: [
            { minQty: 100, maxQty: 500, price: 240 },
            { minQty: 501, maxQty: 1000, price: 230 },
            { minQty: 1001, price: 220 },
        ],
    },
    {
        name: "Sea Salt - Food Grade",
        description: "Premium sea salt suitable for food preparation and culinary use",
        productCode: "SEA-001",
        category: "Food Salt",
        price: 350,
        MOQ: 25,
        stockQty: 3000,
        reorderLevel: 300,
        unit: "kg",
        supplier: "Coastal Salt Works",
        hsn: "2501",
        isActive: true,
        pricingTiers: [
            { minQty: 50, maxQty: 200, price: 340 },
            { minQty: 201, maxQty: 500, price: 330 },
            { minQty: 501, price: 320 },
        ],
    },
    {
        name: "Table Salt - Iodized",
        description: "Iodized table salt enriched with essential minerals for household use",
        productCode: "TABLE-001",
        category: "Table Salt",
        price: 45,
        MOQ: 100,
        stockQty: 8000,
        reorderLevel: 1000,
        unit: "kg",
        supplier: "Domestic Producers",
        hsn: "2501",
        isActive: true,
        pricingTiers: [
            { minQty: 200, maxQty: 500, price: 42 },
            { minQty: 501, maxQty: 1000, price: 40 },
            { minQty: 1001, price: 38 },
        ],
    },
    {
        name: "Epsom Salt - Agricultural Grade",
        description: "Magnesium sulfate salt for agricultural and horticultural applications",
        productCode: "EPSOM-001",
        category: "Agricultural Salt",
        price: 180,
        MOQ: 30,
        stockQty: 2000,
        reorderLevel: 200,
        unit: "kg",
        supplier: "Chemical Suppliers Inc",
        hsn: "2520",
        isActive: true,
        pricingTiers: [
            { minQty: 75, maxQty: 200, price: 170 },
            { minQty: 201, maxQty: 500, price: 160 },
            { minQty: 501, price: 150 },
        ],
    },
    {
        name: "Bath Salt - Himalayan",
        description: "Natural Himalayan pink salt for relaxation and spa treatments",
        productCode: "BATH-001",
        category: "Specialty Salt",
        price: 120,
        MOQ: 20,
        stockQty: 1500,
        reorderLevel: 150,
        unit: "kg",
        supplier: "Himalayan Resources",
        hsn: "2501",
        isActive: true,
        pricingTiers: [
            { minQty: 50, maxQty: 100, price: 110 },
            { minQty: 101, maxQty: 250, price: 100 },
            { minQty: 251, price: 90 },
        ],
    },
];

const generateDummyOrders = (dealerIds, productIds) => {
    const orders = [];
    const statuses = ["pending", "confirmed", "dispatched", "delivered"];
    const paymentStatuses = ["pending", "partial", "completed"];
    const paymentMethods = ["credit", "upi", "bank_transfer", "cash"];

    for (let i = 0; i < 8; i++) {
        const dealerId = dealerIds[Math.floor(Math.random() * dealerIds.length)];
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let totalAmount = 0;

        for (let j = 0; j < itemCount; j++) {
            const product = productIds[Math.floor(Math.random() * productIds.length)];
            const qty = Math.floor(Math.random() * 10) * 50 + 100;
            const unitPrice = Math.floor(Math.random() * 200) + 100;
            const itemTotal = qty * unitPrice;

            items.push({
                productId: product,
                qty,
                unitPrice,
                totalPrice: itemTotal,
            });

            totalAmount += itemTotal;
        }

        // Generate unique orderRef
        const year = new Date().getFullYear().toString().slice(-2);
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        const orderRef = `ORD-${year}${month}${String(i + 1).padStart(5, "0")}`;

        orders.push({
            dealerId,
            items,
            totalAmount,
            orderStatus: statuses[Math.floor(Math.random() * statuses.length)],
            deliveryStage: ["awaiting_confirmation", "in_preparation", "in_transit", "out_for_delivery", "delivered"][
                Math.floor(Math.random() * 5)
            ],
            paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            notes: "Standard order for regular stock",
            orderRef: orderRef,
            orderedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
    }

    return orders;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log("\n🗑️  Clearing existing collections...");
        await Admin.deleteMany({});
        await Dealer.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        await InventoryLedger.deleteMany({});
        await AuditLog.deleteMany({});
        await TokenBlacklist.deleteMany({});
        await DailySnapshot.deleteMany({});
        console.log("✅ Collections cleared");

        // ═══════════════════════════════════════════════════════════════════════
        // SEED ADMINS
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n👨‍💼 Creating Admin users...");
        const adminsData = generateDummyAdmins();
        const admins = [];
        for (const adminData of adminsData) {
            const admin = await Admin.create(adminData);
            admins.push(admin);
        }
        console.log(`✅ Created ${admins.length} admin(s)`);
        admins.forEach((admin) => {
            console.log(`   - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
        });

        // ═══════════════════════════════════════════════════════════════════════
        // SEED DEALERS
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n🤝 Creating Dealer accounts...");
        const dealersData = generateDummyDealers();
        const dealers = [];
        for (const dealerData of dealersData) {
            const dealer = await Dealer.create(dealerData);
            dealers.push(dealer);
        }
        console.log(`✅ Created ${dealers.length} dealer(s)`);
        dealers.forEach((dealer) => {
            console.log(`   - ${dealer.name} (${dealer.email}) - Business: ${dealer.businessName}`);
        });

        // ═══════════════════════════════════════════════════════════════════════
        // SEED PRODUCTS
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n📦 Creating Products...");
        const products = await Product.insertMany(generateDummyProducts());
        console.log(`✅ Created ${products.length} product(s)`);
        products.forEach((product) => {
            console.log(
                `   - ${product.name} (${product.productCode}) - Stock: ${product.stockQty}kg @ ₹${product.price}/unit`
            );
        });

        // ═══════════════════════════════════════════════════════════════════════
        // SEED ORDERS
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n📋 Creating Orders...");
        const ordersData = generateDummyOrders(
            dealers.map((d) => d._id),
            products.map((p) => p._id)
        );
        const orders = await Order.insertMany(ordersData);
        console.log(`✅ Created ${orders.length} order(s)`);
        orders.forEach((order) => {
            console.log(
                `   - Order ${order.orderRef} - Amount: ₹${order.totalAmount} - Status: ${order.orderStatus}`
            );
        });

        // ═══════════════════════════════════════════════════════════════════════
        // SEED INVENTORY LEDGER
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n📊 Creating Inventory Ledger entries...");
        const ledgerEntries = [];

        for (const order of orders) {
            for (const item of order.items) {
                const product = products.find((p) => p._id.toString() === item.productId.toString());

                if (product) {
                    ledgerEntries.push({
                        productId: item.productId,
                        changeType: "debit",
                        quantityChanged: item.qty,
                        previousQty: product.stockQty + item.qty,
                        newQty: product.stockQty,
                        reason: "order_placed",
                        triggeredBy: order._id,
                        triggeredByType: "Order",
                        notes: `Order ${order.orderRef} placed`,
                        createdAt: order.orderedAt,
                    });
                }
            }
        }

        // Add some restock entries
        for (const product of products) {
            ledgerEntries.push({
                productId: product._id,
                changeType: "credit",
                quantityChanged: Math.floor(Math.random() * 1000) + 500,
                previousQty: product.stockQty - Math.floor(Math.random() * 500),
                newQty: product.stockQty,
                reason: "restock",
                triggeredBy: admins[0]._id,
                triggeredByType: "Admin",
                notes: "Monthly restock",
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            });
        }

        const createdLedgers = await InventoryLedger.insertMany(ledgerEntries);
        console.log(`✅ Created ${createdLedgers.length} inventory ledger entries`);

        // ═══════════════════════════════════════════════════════════════════════
        // SEED AUDIT LOGS
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n🔐 Creating Audit Logs...");
        const auditLogs = [];

        // Product creation audits
        for (const product of products) {
            auditLogs.push({
                actorId: admins[0]._id,
                actorRole: "super_admin",
                action: "PRODUCT_ADDED",
                targetCollection: "Product",
                targetId: product._id,
                afterSnapshot: product.toObject(),
                beforeSnapshot: null,
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                status: "success",
            });
        }

        // Order status change audits
        for (const order of orders) {
            auditLogs.push({
                actorId: admins[1]._id,
                actorRole: "admin",
                action: "ORDER_STATUS_CHANGED",
                targetCollection: "Order",
                targetId: order._id,
                beforeSnapshot: { orderStatus: "pending" },
                afterSnapshot: { orderStatus: order.orderStatus },
                ipAddress: "192.168.1.2",
                userAgent: "Mozilla/5.0",
                status: "success",
                context: { newStatus: order.orderStatus },
            });
        }

        // Dealer registration audits
        for (const dealer of dealers) {
            auditLogs.push({
                actorId: admins[0]._id,
                actorRole: "super_admin",
                action: "DEALER_ADDED",
                targetCollection: "Dealer",
                targetId: dealer._id,
                afterSnapshot: dealer.toObject(),
                beforeSnapshot: null,
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                status: "success",
            });
        }

        const createdAudits = await AuditLog.insertMany(auditLogs);
        console.log(`✅ Created ${createdAudits.length} audit log entries`);

        // ═══════════════════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════════════════
        console.log("\n");
        console.log("╔════════════════════════════════════════════════════════════════╗");
        console.log("║          ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!           ║");
        console.log("╚════════════════════════════════════════════════════════════════╝");
        console.log("\n📊 DATA SUMMARY:");
        console.log(`   • Admins Created: ${admins.length}`);
        console.log(`   • Dealers Created: ${dealers.length}`);
        console.log(`   • Products Created: ${products.length}`);
        console.log(`   • Orders Created: ${orders.length}`);
        console.log(`   • Inventory Ledger Entries: ${createdLedgers.length}`);
        console.log(`   • Audit Logs Created: ${createdAudits.length}`);

        console.log("\n🔑 TEST CREDENTIALS:");
        console.log("\n   ADMIN LOGIN:");
        console.log("   • Email: admin@radhey.com");
        console.log("   • Password: Admin@123");
        console.log("\n   DEALER LOGIN:");
        console.log("   • Email: amit.patel@dealer.com");
        console.log("   • Password: Dealer@123");

        console.log("\n📚 API DOCUMENTATION:");
        console.log("   • Swagger UI: http://localhost:8000/api-docs");
        console.log("   • Health Check: http://localhost:8000/api/v1/health");

        console.log("\n🚀 START SERVER:");
        console.log("   • Run: npm start");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error seeding database:", error);
        process.exit(1);
    }
};

// Run the seeding function
seedDatabase();
