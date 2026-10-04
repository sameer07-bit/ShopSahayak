require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function testConnection(uri, label) {
  console.log(`Testing MongoDB connection for ${label}...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ [${label}] CONNECTED! Host: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`❌ [${label}] Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set in .env');
    return;
  }
  await testConnection(uri, 'MongoDB Atlas Cluster');
}

run();
