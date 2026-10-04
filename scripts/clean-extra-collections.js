const mongoose = require('mongoose');

const uri = 'mongodb+srv://admin:admin@cluster0.gyurphn.mongodb.net/ShopSahayak?retryWrites=true&w=majority&appName=Cluster0';

async function cleanupExtraCollections() {
  console.log('Connecting to MongoDB Atlas to clean up dynamic collections...');
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = conn.connection.db;

    const collections = await db.listCollections().toArray();
    console.log('\nCurrent collections in ShopSahayak database:');
    collections.forEach(c => console.log(' -', c.name));

    const extraCollections = collections.filter(c => 
      c.name.startsWith('user_') || 
      c.name.startsWith('messages_') ||
      c.name === 'shopsahayak'
    );

    if (extraCollections.length === 0) {
      console.log('\n✨ No dynamic per-user collections found. Database is already clean!');
    } else {
      console.log(`\n🧹 Found ${extraCollections.length} dynamic collection(s) to drop...`);
      for (const col of extraCollections) {
        await db.collection(col.name).drop();
        console.log(`  ❌ Dropped collection: ${col.name}`);
      }
      console.log('\n✅ All dynamic per-user collections dropped! All users will now be saved in central "users" collection!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

cleanupExtraCollections();
