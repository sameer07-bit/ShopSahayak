const mongoose = require('mongoose');

async function testAtlas() {
  const passwordsToTest = [
    'admin%40123',
    'admin@123',
    'Sameer%40222008'
  ];

  for (const pwd of passwordsToTest) {
    const uri = `mongodb+srv://admin:${pwd}@cluster0.gyurphn.mongodb.net/ShopSahayak?retryWrites=true&w=majority&appName=Cluster0`;
    console.log(`Testing connection with password: ${pwd}...`);
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`\n🎉 SUCCESS! Connected to MongoDB Atlas!`);
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      await mongoose.disconnect();
      return uri;
    } catch (err) {
      console.log(`❌ Failed with ${pwd}: ${err.message}`);
    }
  }
}

testAtlas();
