const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createSale,
  getSalesReport
} = require('../controllers/salesController');
const { sendBillViaWhatsApp } = require('../controllers/whatsappController');

router.get('/', getTransactions);
router.post('/', createSale);
router.get('/report', getSalesReport);
router.post('/send-whatsapp-bill', sendBillViaWhatsApp);

module.exports = router;

