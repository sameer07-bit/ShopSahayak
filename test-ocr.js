require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { recognizeHandwriting } = require('./services/geminiOcrService');

async function test() {
  console.log('Testing Gemini OCR on sample image...');
  const samplePath = path.join(__dirname, 'public', 'samples', 'sample_english.jpg');
  if (!fs.existsSync(samplePath)) {
    console.error('Sample file not found at:', samplePath);
    return;
  }

  const imageBuffer = fs.readFileSync(samplePath);
  try {
    const result = await recognizeHandwriting({
      imageBuffer,
      mimeType: 'image/jpeg',
      apiKey: process.env.GEMINI_API_KEY
    });
    console.log('\n--- OCR RECOGNITION TEST SUCCESSFUL ---');
    console.log('Model Used:', result.modelUsed);
    console.log('Detected Language:', result.detectedLanguage);
    console.log('Full Text Snippet:', result.fullText.substring(0, 300));
    console.log('Total Lines Detected:', result.lines ? result.lines.length : 0);
  } catch (err) {
    console.error('\n❌ OCR Test Failed:', err.message);
  }
}

test();
