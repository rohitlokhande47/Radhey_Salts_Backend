import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Professional email templates for Radhey Salts
const emailTemplates = {
    ORDER_PLACED: (order, dealer) => ({
        subject: `Order Confirmation - ${order.orderRef}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .order-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .order-info p { margin: 10px 0; }
                    .order-info strong { color: #667eea; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .items-table th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #667eea; }
                    .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .items-table tr:nth-child(even) { background: #f9f9f9; }
                    .total { font-size: 18px; font-weight: bold; color: #667eea; text-align: right; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Order Confirmed!</h1>
                        <p>Thank you for your order</p>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${dealer.name}</strong>,</p>
                        <p>Your order has been successfully placed with Radhey Salts. We're preparing your items for shipment.</p>
                        
                        <div class="order-info">
                            <p><strong>Order ID:</strong> ${order.orderRef}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                            <p><strong>Status:</strong> <span style="color: #ff9800;">Pending Confirmation</span></p>
                        </div>

                        <h3>Order Items:</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items
                                    .map(
                                        (item) => `
                                    <tr>
                                        <td>${item.productName || "Product"}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${item.unitPrice.toFixed(2)}</td>
                                        <td>₹${item.total.toFixed(2)}</td>
                                    </tr>
                                `
                                    )
                                    .join("")}
                            </tbody>
                        </table>

                        <div class="total">
                            Total Amount: ₹${order.totalAmount.toFixed(2)}
                        </div>

                        <p>You will receive another email once your order is confirmed and ready for dispatch.</p>
                        
                        <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">Track Your Order</a>

                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            If you have any questions, please contact our support team.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Radhey Salts. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    ORDER_DISPATCHED: (order, dealer) => ({
        subject: `📦 Your Order Has Been Dispatched - ${order.orderRef}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; }
                    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📦 Order Dispatched!</h1>
                        <p>Your order is on the way</p>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${dealer.name}</strong>,</p>
                        <p>Great news! Your order has been dispatched and is on its way to you.</p>
                        
                        <div class="info-box">
                            <p><strong>Order ID:</strong> ${order.orderRef}</p>
                            <p><strong>Dispatch Date:</strong> ${new Date(order.dispatchedAt || new Date()).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span style="color: #4CAF50;">Dispatched</span></p>
                            ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
                        </div>

                        <p>You can track the status of your order using the link below.</p>
                        
                        <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">Track Shipment</a>

                        <p style="margin-top: 30px; color: #666; font-size: 13px;">
                            Expected delivery in 5-7 business days. If you have any concerns, please contact our support.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Radhey Salts. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    ORDER_DELIVERED: (order, dealer) => ({
        subject: `✅ Order Delivered - ${order.orderRef}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; }
                    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Order Delivered!</h1>
                        <p>Thank you for your business</p>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${dealer.name}</strong>,</p>
                        <p>Your order has been successfully delivered! Thank you for choosing Radhey Salts.</p>
                        
                        <div class="info-box">
                            <p><strong>Order ID:</strong> ${order.orderRef}</p>
                            <p><strong>Delivery Date:</strong> ${new Date(order.deliveredAt || new Date()).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span style="color: #4CAF50;">Delivered</span></p>
                        </div>

                        <p>We hope you're satisfied with your purchase. Your feedback is valuable to us.</p>
                        
                        <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">View Order Details</a>

                        <p style="margin-top: 30px; color: #666; font-size: 13px;">
                            Thank you for your continued business!
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Radhey Salts. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    PAYMENT_CONFIRMED: (order, dealer) => ({
        subject: `💳 Payment Confirmed - ${order.orderRef}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3; }
                    .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💳 Payment Confirmed!</h1>
                        <p>Thank you for your payment</p>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${dealer.name}</strong>,</p>
                        <p>Your payment has been successfully processed.</p>
                        
                        <div class="info-box">
                            <p><strong>Order ID:</strong> ${order.orderRef}</p>
                            <p><strong>Amount Paid:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                            <p><strong>Payment Status:</strong> <span style="color: #2196F3;">Completed</span></p>
                            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>

                        <p>Your order is now confirmed and will be prepared for dispatch.</p>
                        
                        <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">View Order</a>

                        <p style="margin-top: 30px; color: #666; font-size: 13px;">
                            If you have any questions, contact our support team.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Radhey Salts. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    LOW_STOCK_ALERT: (product, admin) => ({
        subject: `⚠️ Low Stock Alert - ${product.name}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .alert-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800; }
                    .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Low Stock Alert</h1>
                        <p>Immediate action required</p>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${admin.name}</strong>,</p>
                        <p>A product is running low on inventory and may need restocking.</p>
                        
                        <div class="alert-box">
                            <p><strong>Product:</strong> ${product.name}</p>
                            <p><strong>Current Stock:</strong> <span style="color: #d32f2f; font-weight: bold;">${product.stockQty} units</span></p>
                            <p><strong>Reorder Level:</strong> ${product.reorderLevel} units</p>
                            <p><strong>Product Code:</strong> ${product.productCode}</p>
                        </div>

                        <p>Please review your inventory and restock if necessary to avoid stockouts.</p>
                        
                        <a href="${process.env.FRONTEND_URL}/admin/inventory" class="button">Manage Inventory</a>

                        <p style="margin-top: 30px; color: #666; font-size: 13px;">
                            This is an automated alert to help you maintain optimal inventory levels.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Radhey Salts. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),
};

/**
 * Send email using SendGrid
 * @param {string} recipientEmail - Recipient email address
 * @param {string} eventType - Type of event (ORDER_PLACED, ORDER_DISPATCHED, etc.)
 * @param {object} data - Data object containing order, dealer, product, admin info
 */
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
            replyTo: "support@radhey-salts.com",
        };

        const response = await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${recipientEmail} (${eventType})`);
        return { success: true, messageId: response[0].headers["x-message-id"] };
    } catch (error) {
        console.error(`❌ Email send error for ${eventType}:`, error.message);
        return { success: false, error: error.message };
    }
};
