const fs = require('fs');
const path = require('path');

const src = `C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\5cb98c10-db17-49cd-9bbe-b4abec46d1f1\\telugu_handwritten_note_1791044407487.jpg`;
const dest = path.join(__dirname, 'public', 'samples', 'sample_telugu.jpg');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied sample_telugu.jpg!');
} else {
  console.error('Source file not found:', src);
}
