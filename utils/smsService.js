const Message = require('../models/Message');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Send simulated registration SMS & log to central 'messages' collection
 */
async function sendRegistrationSMS(data) {
  const { phone, name, storeName, email } = data;
  const msgText = `Namaste ${name}! Welcome to ShopSahayak AI Retail Assistant. Your store "${storeName}" is registered successfully in MongoDB Atlas.`;

  let messageDoc = null;
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      messageDoc = await Message.create({
        sender: 'ShopSahayak Admin',
        recipient: name,
        recipientPhone: phone,
        content: msgText,
        type: 'SMS',
        status: 'Sent'
      });

      await Notification.create({
        title: 'New Store Registered',
        message: `${name} registered "${storeName}" (${phone})`,
        type: 'registration',
        read: false
      });
    } catch (err) {
      console.warn('SMS log notice:', err.message);
    }
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const encodedText = encodeURIComponent(msgText);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return {
    status: 'SENT',
    messageId: messageDoc ? messageDoc._id : `SMS-${Date.now()}`,
    recipientPhone: phone,
    content: msgText,
    whatsappUrl
  };
}

module.exports = {
  sendRegistrationSMS
};
