const mongoose = require('mongoose');

const usersToTest = [
  { user: 'admin', pass: 'admin123' },
  { user: 'admin', pass: 'admin' },
  { user: 'admin', pass: '123456' },
  { user: 'admin', pass: 'Sameer222008' },
  { user: 'admin', pass: 'Sameer%40222008' },
  { user: 'admin', pass: 'Sameer' },
  { user: 'sameer', pass: 'sameer' },
  { user: 'sameer', pass: 'Sameer%40222008' },
  { user: 'sameer', pass: 'Sameer222008' },
  { user: 'shopsahayak', pass: 'shopsahayak' },
  { user: 'shopsahayak', pass: 'admin123' },
  { user: 'shaikrahimullah18', pass: 'admin123' },
  { user: 'adithya', pass: 'admin123' }
];

async function scan() {
  for (const item of usersToTest) {
    const uri = `mongodb+srv://${item.user}:${item.pass}@cluster0.gyurphn.mongodb.net/ShopSahayak?retryWrites=true&w=majority&appName=Cluster0`;
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`\n🎉 BINGO! CONNECTED TO ATLAS!`);
      console.log(`User: ${item.user}, Pass: ${item.pass}`);
      console.log(`URI: ${uri}`);
      await mongoose.disconnect();
      return uri;
    } catch (e) {
      // ignore bad auth
    }
  }
  console.log('\nScan completed without finding exact match.');
}

scan();
