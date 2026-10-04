const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const StoreProfile = require('../models/StoreProfile');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { normalizePhone, formatBillMessage, sendWatiMessage } = require('../services/watiService');

/**
 * @desc    Send POS Sale / Invoice Bill to Customer via WATI WhatsApp API
 * @route   POST /api/whatsapp/send-bill
 * @access  Public
 */
exports.sendBillViaWhatsApp = async (req, res, next) => {
  try {
    const {
      billId,
      transactionId,
      orderId,
      id,
      phone,
      whatsappNumber,
      customerId,
      storeName: bodyStoreName
    } = req.body;

    const targetBillId = billId || transactionId || orderId || id;
    const targetPhoneInput = phone || whatsappNumber;

    let transaction = null;
    let customer = null;

    // 1. Find transaction/bill from MongoDB Atlas
    if (targetBillId) {
      transaction = await Transaction.findOne({
        $or: [
          { id: targetBillId },
          { _id: mongoose.Types.ObjectId.isValid(targetBillId) ? targetBillId : null }
        ]
      });
    }

    // If transaction not found by explicit ID, search most recent transaction for customer
    if (!transaction && customerId) {
      transaction = await Transaction.findOne({ customerId }).sort({ createdAt: -1 });
    }

    // If transaction still not found, check if bill details are passed in body
    if (!transaction && req.body.amount) {
      transaction = {
        id: targetBillId || `ORD-${Date.now().toString().slice(-6)}`,
        customer: req.body.customer || 'Customer',
        amount: Number(req.body.amount),
        itemsSummary: req.body.itemsSummary || 'Provisions & Groceries',
        items: req.body.items || [],
        paymentMethod: req.body.paymentMethod || 'Cash',
        status: req.body.status || 'Completed',
        createdAt: new Date()
      };
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Bill / Transaction not found. Please provide a valid billId or orderId.'
      });
    }

    // 2. Find Customer from MongoDB Atlas
    const custIdToSearch = customerId || transaction.customerId;
    const custNameToSearch = transaction.customer;

    if (custIdToSearch) {
      customer = await Customer.findOne({
        $or: [
          { id: custIdToSearch },
          { _id: mongoose.Types.ObjectId.isValid(custIdToSearch) ? custIdToSearch : null }
        ]
      });
    }

    if (!customer && custNameToSearch && custNameToSearch !== 'Walk-in Customer') {
      customer = await Customer.findOne({ name: custNameToSearch });
    }

    // 3. Resolve recipient phone number
    const recipientPhoneInput = targetPhoneInput || (customer ? customer.phone : null);

    if (!recipientPhoneInput) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone / WhatsApp number is missing. Please provide a phone number.'
      });
    }

    const normalizedPhone = normalizePhone(recipientPhoneInput);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: `Invalid WhatsApp phone number format: "${recipientPhoneInput}". Please enter a valid 10-digit Indian mobile number.`
      });
    }

    // 4. Resolve Store Name
    let storeName = bodyStoreName || 'Sharma Kirana Store';
    try {
      const storeProf = await StoreProfile.findOne();
      if (storeProf && storeProf.name) storeName = storeProf.name;
    } catch (e) {
      // fallback
    }

    // 5. Format Bill Text
    const billMessageText = formatBillMessage(transaction, customer, storeName);
    const whatsappDirectUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(billMessageText)}`;

    // 6. Send via WATI Service
    console.log(`💬 Dispatching WATI WhatsApp Bill for Order ${transaction.id || targetBillId} to ${normalizedPhone}...`);
    let watiResult;
    try {
      watiResult = await sendWatiMessage({
        phone: normalizedPhone,
        text: billMessageText,
        customerName: customer ? customer.name : (transaction.customer || 'Valued Customer'),
        templateName: req.body.templateName || null,
        templateParams: req.body.templateParams || null
      });
    } catch (apiErr) {
      console.warn('WATI dispatch fallback:', apiErr.message);
      watiResult = {
        success: true,
        method: 'whatsapp_direct',
        isDirectFallback: true,
        whatsappDirectUrl,
        warning: apiErr.message
      };
    }

    // 7. Persist Message & Notification to MongoDB Atlas
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const msgId = `MSG-WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const custNameStr = customer ? customer.name : (transaction.customer || 'Customer');

        await Message.create({
          messageId: msgId,
          recipientPhone: normalizedPhone,
          recipientName: custNameStr,
          storeName: storeName,
          type: 'KHATA_REMINDER',
          channel: 'WhatsApp',
          content: billMessageText,
          status: 'SENT',
          gateway: 'WATI WhatsApp Business API',
          whatsappUrl: watiResult.whatsappDirectUrl || whatsappDirectUrl
        });

        const notifId = `NOTIF-WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await Notification.create({
          id: notifId,
          category: 'Sales',
          severity: 'success',
          title: 'WhatsApp Invoice Dispatched',
          message: `Bill #${transaction.id || targetBillId} (₹${transaction.amount}) prepared for ${normalizedPhone}`,
          time: 'Just now',
          read: false,
          action: 'view_customer',
          target: customer ? customer.id : null
        });
      } catch (logErr) {
        console.warn('MongoDB Atlas log notice:', logErr.message);
      }
    }

    // 8. Return success response (never returning or exposing WATI API token)
    res.status(200).json({
      success: true,
      message: watiResult.isDirectFallback
        ? 'WhatsApp statement prepared. Click to open in WhatsApp.'
        : 'Bill sent successfully via WATI WhatsApp',
      data: {
        invoiceId: transaction.id || targetBillId,
        recipientPhone: normalizedPhone,
        customerName: customer ? customer.name : transaction.customer,
        amount: transaction.amount,
        status: 'SENT',
        watiMethod: watiResult.method,
        isDirectFallback: Boolean(watiResult.isDirectFallback),
        whatsappDirectUrl: watiResult.whatsappDirectUrl || whatsappDirectUrl
      }
    });

  } catch (error) {
    console.error('❌ WATI WhatsApp Bill Error:', error.message);

    // Handle authentication or API specific errors
    if (error.message.includes('WATI_API_TOKEN is not configured')) {
      return res.status(500).json({
        success: false,
        message: 'WATI API Token is missing from backend configuration (.env).'
      });
    }

    if (error.message.includes('WATI Authentication failed') || error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        message: 'WATI authentication error. Please verify WATI_API_TOKEN in backend .env'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp bill via WATI'
    });
  }
};

/**
 * @desc    Check WATI integration status (safe - never returns tokens)
 * @route   GET /api/whatsapp/status
 * @access  Public
 */
exports.getWatiStatus = async (req, res) => {
  const token = process.env.WATI_API_TOKEN;
  const baseUrl = process.env.WATI_API_URL || 'https://live-mt-server.wati.io';

  res.status(200).json({
    success: true,
    service: 'WATI WhatsApp Business API Service',
    configured: Boolean(token),
    baseUrl: baseUrl.replace(/\/+$/, ''),
    tokenPresent: Boolean(token && token.length > 10)
  });
};
