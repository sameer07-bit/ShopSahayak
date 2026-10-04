require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { recognizeHandwriting } = require('../services/geminiOcrService');

async function testTelugu() {
  console.log('Testing Telugu Handwriting Recognition...');
  const samplePath = path.join(__dirname, '..', 'public', 'samples', 'sample_telugu.jpg');
  if (!fs.existsSync(samplePath)) {
    console.error('Telugu sample not found at:', samplePath);
    return;
  }

  const imageBuffer = fs.readFileSync(samplePath);
  try {
    const result = await recognizeHandwriting({
      imageBuffer,
      mimeType: 'image/jpeg',
      apiKey: process.env.GEMINI_API_KEY,
      domainHint: 'Telugu Script Disambiguation'
    });
    console.log('\n--- TELUGU OCR TEST RESULTS ---');
    console.log('Model Used:', result.modelUsed);
    console.log('Detected Language:', result.detectedLanguage);
    console.log('ISO Language Code:', result.languageCode);
    console.log('\nExtracted Telugu Text:\n', result.fullText);
    console.log('\nTotal Lines Detected:', result.lines ? result.lines.length : 0);
  } catch (err) {
    console.error('\n❌ Telugu OCR Test Failed:', err.message);
  }
}

testTelugu();
