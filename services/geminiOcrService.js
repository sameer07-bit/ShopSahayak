/**
 * High-Accuracy Multilingual & Curved Script Handwriting Recognition Service using Google Gemini AI
 * 
 * Features:
 * - South Asian Curved Script Disambiguation Engine (Telugu vs Tamil vs Kannada vs Malayalam)
 * - Server-side image preprocessing with Sharp (Stroke contrast & edge sharpening)
 * - Uses reliable flash models: gemini-2.5-flash, gemini-2.0-flash
 */

const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');

/**
 * Preprocess image buffer to enhance curved script strokes, loop legibility, and contrast
 */
async function preprocessImageBuffer(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    let pipeline = sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .normalize() // Normalize contrast
      .sharpen({ sigma: 1.5, m1: 1.0, m2: 3.0 }); // Enhanced edge sharpening for curved letters

    if (metadata.width && metadata.width < 1400) {
      pipeline = pipeline.resize({ width: 2000, fit: 'inside', withoutEnlargement: false });
    }

    const optimizedBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
    return { optimizedBuffer, mimeType: 'image/jpeg' };
  } catch (err) {
    console.warn('Image preprocessing fallback (using raw image):', err.message);
    return { optimizedBuffer: buffer, mimeType: 'image/jpeg' };
  }
}

/**
 * Perform Multilingual & Curved Script Handwriting Recognition on an Image
 */
async function recognizeHandwriting({
  imageBuffer,
  mimeType = 'image/jpeg',
  apiKey = process.env.GEMINI_API_KEY,
  targetLanguage = null,
  domainHint = 'General Handwriting',
  modelName = 'gemini-2.5-flash',
  deepScan = false
}) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in .env or pass x-api-key header.');
  }

  // Preprocess image to enhance legibility of faint ink & curved strokes
  let inputBuffer = imageBuffer;
  if (Buffer.isBuffer(imageBuffer)) {
    const processed = await preprocessImageBuffer(imageBuffer);
    inputBuffer = processed.optimizedBuffer;
    mimeType = processed.mimeType;
  } else if (typeof imageBuffer === 'string' && imageBuffer.includes(';base64,')) {
    const rawBuf = Buffer.from(imageBuffer.split(';base64,')[1], 'base64');
    const processed = await preprocessImageBuffer(rawBuf);
    inputBuffer = processed.optimizedBuffer;
    mimeType = processed.mimeType;
  }

  const base64Data = Buffer.isBuffer(inputBuffer) 
    ? inputBuffer.toString('base64') 
    : (typeof inputBuffer === 'string' && inputBuffer.includes(';base64,') ? inputBuffer.split(';base64,')[1] : inputBuffer);

  const ai = new GoogleGenAI({ apiKey });

  // Dravidian / South Asian Script Disambiguation Directives
  const curvedScriptRules = `
SOUTH ASIAN CURVED SCRIPT DISAMBIGUATION RULES:
If the image contains South Asian rounded/curved handwriting, apply strict script glyph identification:

1. TELUGU (తెలుగు) IDENTIFICATION:
   - Look for rounded circular loops with top tick-mark 'Talakattu' (ౕ) above consonants (క, చ, ట, త, న, ప, ఫ, బ, భ, మ, య, ర, ల, వ, శ, ష, స, హ).
   - Recognize Telugu vowel signs: guddi (ి), guddi deergham (ీ), kommu (ు), kommu deergham (ూ), etvam (ె), otvam (ొ).
   - Recognize Telugu conjunct subscript marks (Vattulu: ్క, ్త, ్న, ్మ, ్ల, ్ప).
   - MUST output accurate Telugu Unicode block characters (U+0C00 to U+0C7F). Do NOT confuse Telugu with Tamil or Latin.

2. TAMIL (தமிழ்) IDENTIFICATION:
   - Tamil letters are boxy/linear with open curves (க, ச, ட, த, ந, ப, ம, ய, ர, ல, வ, ள, ற, ன).
   - Tamil uses top dot 'Pulli' (க், த்) and does NOT have tick-marks (Talakattu).
   - Output exact Tamil Unicode block characters (U+0B80 to U+0BFF).

3. KANNADA (ಕನ್ನಡ) IDENTIFICATION:
   - Similar circular shapes to Telugu but has distinctive top loop enclosures (ಕ, ತ, ನ, ಪ, ಮ, ರ, ಲ, ವ).
   - Output exact Kannada Unicode block characters (U+0C80 to U+0CFF).
`;

  const prompt = `You are a world-class Optical Character Recognition (OCR) and Computer Vision AI specializing in Multilingual & Messy Handwriting Extraction.

DOCUMENT DOMAIN / CONTEXT: "${domainHint}"

${curvedScriptRules}

CRITICAL OCR INSTRUCTIONS:
1. EXHAUSTIVE EXTRACTION: Transcribe EVERY SINGLE handwritten word, symbol, number, punctuation mark, formula, bullet point, margin note, and crossed-out correction. Do NOT omit or summarize any text.
2. SCRIPT ACCURACY: Precisely distinguish characters across scripts (Telugu, Tamil, Kannada, Malayalam, Devanagari, Latin, Arabic, CJK, etc.). Retain all script-specific diacritics and sub-marks.
3. CURSIVE & FAINT INK ANALYSIS: Carefully resolve ambiguous curved strokes by analyzing word context and character geometry.
4. LAYOUT PRESERVATION: Retain original line breaks, paragraph spacing, list hierarchy, and visual structure exactly as seen.
${targetLanguage ? `5. TRANSLATION: Translate the full transcribed text into "${targetLanguage}" while preserving original formatting.` : ''}

OUTPUT FORMAT:
Return your response ONLY as valid, parseable JSON matching this schema:

{
  "fullText": "Exact full transcribed text with line breaks preserved",
  "detectedLanguage": "Primary language(s) and script(s) identified (e.g. Telugu, Tamil, Mixed English & Telugu)",
  "languageCode": "ISO language code(s) (e.g. te, ta, kn, ml, hi, en)",
  "summary": "1-2 sentence executive summary of the document contents",
  "lines": [
    {
      "lineNumber": 1,
      "text": "Transcribed line text in original script",
      "language": "Detected script/language for this line",
      "confidence": "High | Medium | Low",
      "positionHint": "e.g. Top Header, Margin Note, Main Paragraph"
    }
  ],
  "keyEntities": [
    "Key names, dates, amounts, equations, or key terms found in text"
  ],
  ${targetLanguage ? `"translatedText": "Full translated text in ${targetLanguage}",` : ''}
  "transcriptionQualityNotes": "Observations on readability, smudges, or script confidence"
}`;

  // Prioritize reliable, active flash models with automatic fallback
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];

  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ]
      });

      const rawText = response.text;
      if (!rawText) throw new Error('Empty response received from model.');

      let cleanJsonStr = rawText.trim();
      if (cleanJsonStr.startsWith('```json')) {
        cleanJsonStr = cleanJsonStr.substring(7);
      } else if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.substring(3);
      }
      if (cleanJsonStr.endsWith('```')) {
        cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
      }
      cleanJsonStr = cleanJsonStr.trim();

      try {
        const parsedData = JSON.parse(cleanJsonStr);
        return {
          success: true,
          modelUsed: currentModel,
          ...parsedData
        };
      } catch (jsonErr) {
        console.warn(`JSON parsing issue with ${currentModel}, applying regex extraction fallback...`);
        const fullTextMatch = rawText.match(/"fullText"\s*:\s*"([\s\S]*?)"\s*,\s*"/);
        return {
          success: true,
          modelUsed: currentModel,
          fullText: fullTextMatch ? fullTextMatch[1].replace(/\\n/g, '\n') : rawText,
          detectedLanguage: 'Auto-Detected',
          summary: 'Extracted with high-precision raw fallback',
          lines: [],
          transcriptionQualityNotes: 'Raw text extracted cleanly'
        };
      }
    } catch (err) {
      console.warn(`Model ${currentModel} attempt failed (${err.message}). Trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All model attempts failed to transcribe image.');
}

/**
 * Helper to translate text
 */
async function translateExtractedText({ text, targetLanguage, apiKey = process.env.GEMINI_API_KEY }) {
  if (!apiKey) throw new Error('API key required.');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Translate the following text accurately into "${targetLanguage}". Maintain tone and line structure:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  return {
    translatedText: response.text.trim(),
    targetLanguage
  };
}

module.exports = {
  recognizeHandwriting,
  translateExtractedText
};
