require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Initialize Express App
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/samples', express.static(path.join(__dirname, 'public', 'samples')));

// Ensure public/samples exists
const samplesDir = path.join(__dirname, 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// API Route Mounts
app.use('/api/store', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ShopSahayak AI Retail Engine & Multilingual Handwriting OCR',
    database: 'MongoDB Atlas',
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [ShopSahayak Unified AI System] Server running on:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`📦 Database: MongoDB Atlas (${process.env.MONGO_URI ? 'Connected' : 'Missing URI'})`);
  console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

module.exports = app;
