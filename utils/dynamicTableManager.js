const mongoose = require('mongoose');

/**
 * Sanitize phone number helper
 */
function sanitizePhone(phone) {
  if (!phone) return '0000000000';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits || '0000000000';
}

/**
 * Helper to record user logs in central 'users' collection
 */
async function createUserTable(userData) {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return null;
    }
    // All users now stored in central 'users' collection
    return { tableName: 'users', count: 1 };
  } catch (err) {
    console.warn('Table manager notice:', err.message);
    return null;
  }
}

async function recordDataInUserTable(phone, data) {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return null;
    }
    return { success: true, collection: 'messages' };
  } catch (err) {
    return null;
  }
}

module.exports = {
  sanitizePhone,
  createUserTable,
  recordDataInUserTable
};
