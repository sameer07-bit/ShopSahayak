const express = require('express');
const router = express.Router();
const { sendBillViaWhatsApp, getWatiStatus } = require('../controllers/whatsappController');

router.post('/send-bill', sendBillViaWhatsApp);
router.get('/status', getWatiStatus);

module.exports = router;
