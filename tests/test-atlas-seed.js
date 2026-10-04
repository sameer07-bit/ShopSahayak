const mongoose = require('mongoose');
const { productsData, customersData, transactionsData, suppliersData } = require('../utils/seedData');

const uri = 'mongodb+srv://admin:admin@cluster0.gyurphn.mongodb.net/ShopSahayak?retryWrites=true&w=majority&appName=Cluster0';

async function seedAtlasDatabase() {
  console.log('Connecting to MongoDB Atlas with uri:', uri);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`\n✅ Connected to host: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    const Product = require('../models/Product');
    const Customer = require('../models/Customer');
    const Supplier = require('../models/Supplier');
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const OcrScan = require('../models/OcrScan');
    const VoiceSession = require('../models/VoiceSession');

    // 1. Seed Users
    const uCount = await User.countDocuments();
    if (uCount === 0) {
      await User.create([
        {
          name: 'Ravi Sharma (Owner)',
          email: 'admin@shopsahayak.com',
          password: 'password123',
          role: 'owner',
          phone: '+91 98490 23145',
          storeName: 'Sharma Kirana Store',
          storeCategory: 'Grocery & FMCG',
          address: 'KPHB Phase 3, Hyderabad',
          gstin: '36AABCS1429B1Z8',
          upiId: 'sharmakirana@icici'
        },
        {
          name: 'Sameer (Store Manager)',
          email: 'sameer@shopsahayak.com',
          password: 'password123',
          role: 'manager',
          phone: '+91 98765 43210',
          storeName: 'Sharma Kirana Store',
          storeCategory: 'Grocery & FMCG'
        }
      ]);
      console.log('🌱 [Atlas Seed] Seeded 2 Users into ShopSahayak.users collection!');
    } else {
      console.log(`ℹ️ [Atlas] Users collection already has ${uCount} document(s).`);
    }

    // 2. Seed Products
    const pCount = await Product.countDocuments();
    if (pCount === 0 && productsData) {
      await Product.insertMany(productsData);
      console.log(`🌱 [Atlas Seed] Seeded ${productsData.length} Products into ShopSahayak.products collection!`);
    } else {
      console.log(`ℹ️ [Atlas] Products collection already has ${pCount} document(s).`);
    }

    // 3. Seed Customers
    const cCount = await Customer.countDocuments();
    if (cCount === 0 && customersData) {
      await Customer.insertMany(customersData);
      console.log(`🌱 [Atlas Seed] Seeded ${customersData.length} Customers into ShopSahayak.customers collection!`);
    } else {
      console.log(`ℹ️ [Atlas] Customers collection already has ${cCount} document(s).`);
    }

    // 4. Seed Suppliers
    const sCount = await Supplier.countDocuments();
    if (sCount === 0 && suppliersData) {
      await Supplier.insertMany(suppliersData);
      console.log(`🌱 [Atlas Seed] Seeded ${suppliersData.length} Suppliers into ShopSahayak.suppliers collection!`);
    } else {
      console.log(`ℹ️ [Atlas] Suppliers collection already has ${sCount} document(s).`);
    }

    // 5. Seed Transactions
    const tCount = await Transaction.countDocuments();
    if (tCount === 0 && transactionsData) {
      await Transaction.insertMany(transactionsData);
      console.log(`🌱 [Atlas Seed] Seeded ${transactionsData.length} Transactions into ShopSahayak.transactions collection!`);
    } else {
      console.log(`ℹ️ [Atlas] Transactions collection already has ${tCount} document(s).`);
    }

    // 6. Seed Initial OCR Scan
    const ocrCount = await OcrScan.countDocuments();
    if (ocrCount === 0) {
      await OcrScan.create({
        fileName: 'telugu_handwriting_recipe.jpg',
        detectedLanguage: 'Telugu (తెలుగు)',
        languageCode: 'te',
        domainHint: 'Telugu Script Disambiguation',
        fullText: 'తెలుగు పద్యాలు మరియు విషయాలు\nపద్యం: వేమన - "పట్టుపట్టరాదు పట్టి విడువరాదు..."',
        summary: 'Telugu handwritten verse and kirana notes',
        modelUsed: 'gemini-2.5-flash',
        lines: [
          { lineNumber: 1, text: 'తెలుగు పద్యాలు మరియు విషయాలు', language: 'Telugu', confidence: 'High' }
        ]
      });
      console.log('🌱 [Atlas Seed] Seeded Initial OCR Scan into ShopSahayak.ocrscans collection!');
    }

    // 7. Seed Initial Voice Session
    const voiceCount = await VoiceSession.countDocuments();
    if (voiceCount === 0) {
      await VoiceSession.create({
        userTranscript: 'rice entha undi babu',
        aiResponse: 'Sona Masoori Rice current stock is 18 bags. 30-day velocity is 9.3 bags/day.',
        detectedLanguage: 'Telugu + English',
        intent: 'inventory_check'
      });
      console.log('🌱 [Atlas Seed] Seeded Initial Voice Session into ShopSahayak.voicesessions collection!');
    }

    console.log('\n🎉 ALL COLLECTIONS & TABLES ARE NOW FULLY CREATED IN SHOPSAHAYAK DATABASE ON CLUSTER0!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error seeding Atlas:', err);
  }
}

seedAtlasDatabase();
