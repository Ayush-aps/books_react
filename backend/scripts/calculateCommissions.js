/**
 * One-time script to calculate commissions for existing delivered orders
 * Run this once to populate commission fields for historical orders
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

const calculateCommissions = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully!');

        // Find all delivered orders without calculated commission
        const deliveredOrders = await Order.find({
            orderStatus: 'delivered',
            commissionCalculated: { $ne: true }
        });

        console.log(`Found ${deliveredOrders.length} delivered orders without commission calculated`);

        let updated = 0;
        for (const order of deliveredOrders) {
            // Calculate subtotal from items if not set
            if (!order.subtotal || order.subtotal === 0) {
                order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }

            // Admin gets 5% of subtotal
            order.adminCommission = order.subtotal * 0.05;

            // Seller gets 95% of subtotal + all other charges
            order.sellerRevenue = (order.subtotal * 0.95) + (order.tax || 0) + (order.shippingCost || 0);

            // Mark as calculated
            order.commissionCalculated = true;

            await order.save();
            updated++;
            console.log(`Updated order ${order.orderId}: Admin Commission = ₹${order.adminCommission.toFixed(2)}, Seller Revenue = ₹${order.sellerRevenue.toFixed(2)}`);
        }

        console.log(`\n✅ Successfully updated ${updated} orders`);

        // Calculate total admin revenue
        const allDeliveredOrders = await Order.find({ orderStatus: 'delivered' });
        const totalAdminRevenue = allDeliveredOrders.reduce((sum, order) => sum + (order.adminCommission || 0), 0);

        console.log(`\n📊 Total Admin Revenue: ₹${totalAdminRevenue.toFixed(2)}`);

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

calculateCommissions();
