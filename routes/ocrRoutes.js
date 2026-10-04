const express = require('express');
const router = express.Router();
const multer = require('multer');
const { recognizeImage, getScanHistory, translateText } = require('../controllers/ocrController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post('/recognize', upload.single('image'), recognizeImage);
router.get('/history', getScanHistory);
router.post('/translate', translateText);

module.exports = router;
