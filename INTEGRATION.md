# Integration & Deployment Guide: Multilingual Handwriting OCR Engine

This document provides step-by-step instructions on how to drop this multilingual handwriting recognition engine into any existing codebase or deploy it to production.

---

## 1. Quick Integration into an Existing Node.js / Express Project

If you already have a Node.js / Express / Next.js backend, you can directly copy the service file:

### Step 1: Copy `services/geminiOcrService.js`
Copy `d:\ai-reader\services\geminiOcrService.js` into your project's `services/` or `lib/` folder.

### Step 2: Install Google Gen AI SDK
In your project directory, run:
```bash
npm install @google/genai
```

### Step 3: Usage in code

```javascript
const { recognizeHandwriting } = require('./services/geminiOcrService');
const fs = require('fs');

async function processImage() {
  const imageBuffer = fs.readFileSync('./handwritten_note.jpg');
  
  const result = await recognizeHandwriting({
    imageBuffer: imageBuffer,
    mimeType: 'image/jpeg', // 'image/png', 'image/webp', etc.
    apiKey: process.env.GEMINI_API_KEY,
    targetLanguage: 'English' // Optional: auto translate to any language
  });

  console.log('Full Extracted Text:', result.fullText);
  console.log('Detected Language:', result.detectedLanguage);
  console.log('Line-by-line Breakdown:', result.lines);
  console.log('Summary:', result.summary);
}
```

---

## 2. Using via REST API (For React, Vue, Mobile Apps, Python, cURL)

You can run this project as a microservice on `http://localhost:3000` or a deployed URL.

### Endpoint: `POST /api/ocr/recognize`

**Headers:**
- `x-api-key`: *(Optional)* Gemini API Key (defaults to `.env` key if omitted)

**Multipart Form-Data:**
- `image`: The uploaded image file
- `targetLanguage`: *(Optional)* e.g. "English", "Spanish", "Hindi"
- `modelName`: *(Optional)* "gemini-2.5-flash" (default) or "gemini-1.5-pro"

### Example cURL Request:
```bash
curl -X POST http://localhost:3000/api/ocr/recognize \
  -F "image=@/path/to/handwritten_recipe.jpg" \
  -F "targetLanguage=English"
```

### Example Python Integration:
```python
import requests

url = "http://localhost:3000/api/ocr/recognize"
files = {'image': open('handwritten_note.jpg', 'rb')}
data = {'targetLanguage': 'English'}

response = requests.post(url, files=files, data=data)
result = response.json()

print("Extracted Text:", result["fullText"])
print("Detected Language:", result["detectedLanguage"])
```

---

## 3. Production Deployment Options

### Option A: Docker Deployment (Recommended)
1. Build the container:
   ```bash
   docker build -t ai-reader .
   ```
2. Run with your API key:
   ```bash
   docker run -d -p 3000:3000 -e GEMINI_API_KEY="your_api_key" --name ai-reader-app ai-reader
   ```

### Option B: Deploy to Render / Vercel / Railway / Heroku
1. Push this directory to your GitHub repository.
2. Connect the repository to Render or Railway.
3. Set the Environment Variable in your deployment dashboard:
   `GEMINI_API_KEY = AQ.Ab8RN6...`
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`

---

## 4. Key Features & Strengths
- **Multilingual & Multi-script**: English, Hindi (Devanagari), Arabic, Spanish, French, German, Japanese, Chinese, Tamil, Cyrillic, Greek, Hebrew, etc.
- **Cursive & Messy Handwriting**: Fine-tuned vision prompt engineered specifically for low contrast, whiteboards, notes, forms, and receipts.
- **Structured Output**: Line-by-line breakdown with confidence metrics, document summary, and key entity tags.
- **Auto-translation**: Instant translation of scanned handwritten notes into any language.
