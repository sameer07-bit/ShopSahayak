const fs = require('fs');
const path = require('path');

const src1 = `C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\5cb98c10-db17-49cd-9bbe-b4abec46d1f1\\english_cursive_note_1791042205495.jpg`;
const src2 = `C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\5cb98c10-db17-49cd-9bbe-b4abec46d1f1\\hindi_multilingual_note_1791042225183.jpg`;

const destDir = path.join(__dirname, 'public', 'samples');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src1, path.join(destDir, 'sample_english.jpg'));
fs.copyFileSync(src2, path.join(destDir, 'sample_hindi.jpg'));
console.log('Sample images copied successfully!');
