const { recognizeHandwriting, translateExtractedText } = require('../services/geminiOcrService');
const OcrScan = require('../models/OcrScan');
const mongoose = require('mongoose');

/**
 * @desc    Process image OCR scan & persist to MongoDB Atlas
 * @route   POST /api/ocr/recognize
 */
exports.recognizeImage = async (req, res, next) => {
  try {
    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    const userApiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.GEMINI_API_KEY;
    const targetLanguage = req.body.targetLanguage || null;
    const domainHint = req.body.domainHint || 'General Handwriting';
    const modelName = req.body.modelName || 'gemini-2.5-flash';
    const deepScan = req.body.deepScan === 'true' || req.body.deepScan === true;

    if (!userApiKey) {
      return res.status(400).json({ error: 'Missing Gemini API Key in server configuration.' });
    }

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      const base64Str = req.body.imageBase64;
      if (base64Str.startsWith('data:')) {
        mimeType = base64Str.split(';')[0].split(':')[1];
        imageBuffer = Buffer.from(base64Str.split(',')[1], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Str, 'base64');
      }
    } else {
      return res.status(400).json({ error: 'No image uploaded. Please attach file or imageBase64.' });
    }

    const ocrResult = await recognizeHandwriting({
      imageBuffer,
      mimeType,
      apiKey: userApiKey,
      targetLanguage,
      domainHint,
      modelName,
      deepScan
    });

    // Save OCR scan record to MongoDB Atlas cloud database if connected
    let savedScan = null;
    if (mongoose.connection.readyState === 1) {
      try {
        savedScan = await OcrScan.create({
          fileName: req.file ? req.file.originalname : 'handwriting_scan.jpg',
          detectedLanguage: ocrResult.detectedLanguage || 'Auto-Detected',
          languageCode: ocrResult.languageCode || 'auto',
          domainHint: domainHint,
          fullText: ocrResult.fullText || '',
          translatedText: ocrResult.translatedText || null,
          summary: ocrResult.summary || '',
          modelUsed: ocrResult.modelUsed || modelName,
          lines: ocrResult.lines || [],
          keyEntities: ocrResult.keyEntities || []
        });
        console.log(`💾 [MongoDB Atlas] Saved OCR Scan ID: ${savedScan._id}`);
      } catch (dbErr) {
        console.warn('MongoDB Atlas persistence warning:', dbErr.message);
      }
    }

    res.json({
      ...ocrResult,
      dbId: savedScan ? savedScan._id : null
    });
  } catch (error) {
    console.error('OCR Controller Error:', error);
    res.status(500).json({ error: 'Recognition failed', details: error.message });
  }
};

/**
 * @desc    Get all saved OCR scans from MongoDB Atlas
 * @route   GET /api/ocr/history
 */
exports.getScanHistory = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const scans = await OcrScan.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, count: scans.length, scans });
    }
    res.json({ success: true, count: 0, scans: [], note: 'Database connecting' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan history', details: err.message });
  }
};

/**
 * @desc    Translate OCR text
 * @route   POST /api/ocr/translate
 */
exports.translateText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const userApiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.GEMINI_API_KEY;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required.' });
    }

    const result = await translateExtractedText({
      text,
      targetLanguage,
      apiKey: userApiKey
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Translation failed', details: error.message });
  }
};
