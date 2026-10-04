const mongoose = require('mongoose');

const ocrScanSchema = new mongoose.Schema(
  {
    scanId: {
      type: String,
      required: true,
      default: () => `OCR-${Date.now()}`
    },
    fileName: {
      type: String,
      default: 'handwriting_scan.jpg'
    },
    detectedLanguage: {
      type: String,
      default: 'Auto-Detected'
    },
    languageCode: {
      type: String,
      default: 'auto'
    },
    domainHint: {
      type: String,
      default: 'General Handwriting'
    },
    fullText: {
      type: String,
      required: true
    },
    translatedText: {
      type: String,
      default: null
    },
    summary: {
      type: String,
      default: ''
    },
    modelUsed: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    lines: [
      {
        lineNumber: Number,
        text: String,
        language: String,
        confidence: String
      }
    ],
    keyEntities: [String],
    userId: {
      type: String,
      default: 'USER-ADMIN'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OcrScan', ocrScanSchema);
