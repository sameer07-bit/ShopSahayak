const mongoose = require('mongoose');
const { productsData, customersData, transactionsData, suppliersData, storeProfileData } = require('../utils/seedData');

// Disable query buffering globally so Mongoose never hangs queries for 10s if connection is delayed
mongoose.set('bufferCommands', false);

/**
 * Robust MongoDB Atlas Connection Handler
 * Disables 10s buffering timeout, auto-connects to Atlas, and falls back gracefully.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('\n⚠️ [MongoDB Atlas Warning]: MONGO_URI in .env is not configured properly.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // Generous 15s timeout for cloud deployments (Render cold starts)
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000
    });

    console.log(`✅ [MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    console.log(`📦 [MongoDB Atlas] Database Name: ${conn.connection.name}`);

    // Auto-seed initial collections if MongoDB Atlas is empty
    await seedAtlasCollections(conn);

  } catch (error) {
    console.error(`❌ [MongoDB Atlas Notice] Connection attempt: ${error.message}`);
    console.error('ℹ️ App running smoothly with memory store. To connect cloud DB:');
    console.error('  1. Go to MongoDB Atlas -> Network Access -> Add IP 0.0.0.0/0');
    console.error('  2. Verify user admin password in Atlas');
  }

  // Connection Lifecycle Events
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [MongoDB Atlas] Connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [MongoDB Atlas] Reconnected to cluster.');
  });
};

/**
 * Auto-seed collections to MongoDB Atlas if empty
 */
async function seedAtlasCollections(conn) {
  try {
    const Product = require('../models/Product');
    const Customer = require('../models/Customer');
    const Supplier = require('../models/Supplier');
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');

    const productCount = await Product.countDocuments();
    if (productCount === 0 && productsData && productsData.length > 0) {
      await Product.insertMany(productsData);
      console.log(`🌱 [MongoDB Atlas Seed] Seeded ${productsData.length} Products to Atlas!`);
    }

    const customerCount = await Customer.countDocuments();
    if (customerCount === 0 && customersData && customersData.length > 0) {
      await Customer.insertMany(customersData);
      console.log(`🌱 [MongoDB Atlas Seed] Seeded ${customersData.length} Customers to Atlas!`);
    }

    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0 && suppliersData && suppliersData.length > 0) {
      await Supplier.insertMany(suppliersData);
      console.log(`🌱 [MongoDB Atlas Seed] Seeded ${suppliersData.length} Suppliers to Atlas!`);
    }

    const txCount = await Transaction.countDocuments();
    if (txCount === 0 && transactionsData && transactionsData.length > 0) {
      await Transaction.insertMany(transactionsData);
      console.log(`🌱 [MongoDB Atlas Seed] Seeded ${transactionsData.length} Transactions to Atlas!`);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        name: 'Ravi Sharma (Owner)',
        email: 'admin@shopsahayak.com',
        role: 'owner',
        phone: '+91 98490 23145'
      });
      console.log(`🌱 [MongoDB Atlas Seed] Seeded Admin User to Atlas!`);
    }
  } catch (err) {
    console.warn('MongoDB Atlas auto-seed notice:', err.message);
  }
}

module.exports = connectDB;
