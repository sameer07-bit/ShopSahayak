const mongoose = require('mongoose');

async function testConnection(uri, label) {
  console.log(`Testing connection for ${label}...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`✅ ${label} CONNECTED! Host:`, conn.connection.host);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`❌ ${label} Failed:`, err.message);
    return false;
  }
}

async function run() {
  const uri1 = 'mongodb+srv://admin:Sameer%40222008@cluster0.gyurphn.mongodb.net/shopsahayak?retryWrites=true&w=majority&appName=Cluster0';
  const uri2 = 'mongodb+srv://admin:Sameer222008@cluster0.gyurphn.mongodb.net/shopsahayak?retryWrites=true&w=majority&appName=Cluster0';
  const uri3 = 'mongodb+srv://admin:Sameer@cluster0.gyurphn.mongodb.net/shopsahayak?retryWrites=true&w=majority&appName=Cluster0';
  const uri4 = 'mongodb://127.0.0.1:27017/shopsahayak';

  if (await testConnection(uri1, 'Encoded Password (Sameer%40222008)')) return;
  if (await testConnection(uri2, 'Password without @ (Sameer222008)')) return;
  if (await testConnection(uri3, 'Password Sameer')) return;
  await testConnection(uri4, 'Local MongoDB Fallback');
}

run();
