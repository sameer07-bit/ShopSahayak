/**
 * WATI WhatsApp Business API Service
 * Manages WATI API connections, Indian phone number normalization,
 * bill formatting, and message/document dispatch over WhatsApp.
 * Uses native fetch (Node.js 18+).
 */

/**
 * Normalize phone numbers to WATI international format (e.g., 919849023145)
 */
function normalizePhone(phoneInput) {
  if (!phoneInput) return null;
  let str = String(phoneInput).trim();
  str = str.replace(/[^\d+]/g, '');

  if (str.startsWith('+')) {
    str = str.substring(1);
  }

  // 10-digit Indian mobile number
  if (/^[6-9]\d{9}$/.test(str)) {
    return `91${str}`;
  }

  // 12-digit number starting with 91
  if (/^91[6-9]\d{9}$/.test(str)) {
    return str;
  }

  // 11-digit number starting with 0
  if (str.startsWith('0') && str.length === 11) {
    const withoutZero = str.substring(1);
    if (/^[6-9]\d{9}$/.test(withoutZero)) {
      return `91${withoutZero}`;
    }
  }

  // Generic valid international phone (10 to 15 digits)
  if (/^\d{10,15}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Formats a clean, readable WhatsApp bill/invoice message
 */
function formatBillMessage(transaction, customer, storeName = 'Sharma Kirana Store') {
  const invoiceId = transaction.id || transaction._id || `ORD-${Date.now()}`;
  const amount = Number(transaction.amount || 0).toLocaleString('en-IN');
  const dateStr = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const custName = customer ? customer.name : (transaction.customer || 'Valued Customer');
  const paymentMethod = transaction.paymentMethod || 'Cash';

  let itemsText = '';
  if (Array.isArray(transaction.items) && transaction.items.length > 0) {
    itemsText = transaction.items
      .map((item) => `• *${item.name || 'Item'}* x ${item.quantity || 1} — ₹${Number(item.total || item.price * (item.quantity || 1)).toLocaleString('en-IN')}`)
      .join('\n');
  } else {
    itemsText = `• *${transaction.itemsSummary || 'Provisions & Groceries'}* x ${transaction.itemsCount || 1} — ₹${amount}`;
  }

  return `🧾 *${storeName.toUpperCase()} — TAX INVOICE*
----------------------------------------
*Invoice No:* \`${invoiceId}\`
*Date:* ${dateStr}
*Customer:* ${custName}

*PURCHASED ITEMS:*
${itemsText}

----------------------------------------
💰 *TOTAL AMOUNT:* ₹${amount}
💳 *PAYMENT MODE:* ${paymentMethod}
STATUS: *${transaction.status || 'Completed'}*
----------------------------------------
Thank you for shopping at *${storeName}*!
_Powered by ShopSahayak AI_`;
}

/**
 * Send WhatsApp message via WATI API using native fetch (V3 API + V1 Multi-tenant fallback)
 */
async function sendWatiMessage({ phone, text, templateName, templateParams, customerName }) {
  const token = process.env.WATI_API_TOKEN;
  if (!token) {
    throw new Error('WATI_API_TOKEN is not configured in backend environment variables (.env).');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new Error(`Invalid phone number format: "${phone}". Must be a valid 10-digit or 12-digit Indian mobile number.`);
  }

  let baseUrl = (process.env.WATI_API_URL || 'https://live-mt-server.wati.io').trim().replace(/\/+$/, '');
  const tenantId = '45bf03b2-b089-4c50-a472-85627a10aa9b';

  // Format auth header: WATI requires Bearer <token>
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const headers = {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };

  const whatsappDirectUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
  let lastErrorMsg = null;

  // 1. Ensure Contact is registered in WATI V3 directory
  try {
    const contactUrl = `${baseUrl}/api/ext/v3/contacts`;
    await fetch(contactUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        whatsapp_number: normalizedPhone,
        name: customerName || `Customer ${normalizedPhone.slice(-4)}`,
        custom_params: [
          { name: 'phone', value: normalizedPhone }
        ]
      })
    });
  } catch (err) {
    console.warn('WATI contact register notice:', err.message);
  }

  // 2. Try modern WATI API V3 text message endpoint
  try {
    const v3TextUrl = `${baseUrl}/api/ext/v3/conversations/messages/text`;
    console.log(`📱 Sending WATI V3 WhatsApp message to ${normalizedPhone}...`);
    const resp = await fetch(v3TextUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        target: normalizedPhone,
        text: text
      })
    });

    const body = await resp.json().catch(() => ({}));
    console.log(`📱 WATI V3 Response Status: ${resp.status}`, body);

    if (resp.ok) {
      return {
        success: true,
        method: 'wati_v3_session',
        recipientPhone: normalizedPhone,
        whatsappDirectUrl,
        data: body
      };
    }

    lastErrorMsg = body.message || body.info || `WATI V3 HTTP ${resp.status}`;
  } catch (err) {
    lastErrorMsg = err.message;
    console.warn('WATI V3 text notice:', err.message);
  }

  // 3. Try WATI V3 Template Message (pre-approved or system template)
  try {
    const tName = templateName || 'new_chat_v1';
    const v3TplUrl = `${baseUrl}/api/ext/v3/messageTemplates/send`;
    console.log(`📱 Trying WATI V3 Template (${tName}) to ${normalizedPhone}...`);
    const resp = await fetch(v3TplUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        template_name: tName,
        broadcast_name: `invoice_${Date.now()}`,
        recipients: [
          {
            phone_number: normalizedPhone,
            custom_params: templateParams || [{ name: 'name', value: customerName || 'Valued Customer' }]
          }
        ]
      })
    });

    const body = await resp.json().catch(() => ({}));
    console.log(`📱 WATI Template Response Status: ${resp.status}`, body);

    if (resp.ok && body.success) {
      return {
        success: true,
        method: 'wati_v3_template',
        recipientPhone: normalizedPhone,
        whatsappDirectUrl,
        data: body
      };
    }
    lastErrorMsg = body.message || lastErrorMsg;
  } catch (err) {
    console.warn('WATI template notice:', err.message);
  }

  // 4. Try WATI Multi-Tenant V1 Session Message endpoint with tenantId in path
  try {
    const v1Url = `${baseUrl}/${tenantId}/api/v1/sendSessionMessage/${normalizedPhone}`;
    const resp = await fetch(v1Url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ messageText: text })
    });

    const body = await resp.json().catch(() => ({}));
    if (resp.ok) {
      return {
        success: true,
        method: 'wati_v1_session',
        recipientPhone: normalizedPhone,
        whatsappDirectUrl,
        data: body
      };
    }
  } catch (err) {
    console.warn('WATI V1 session notice:', err.message);
  }

  // 5. If outbound Meta 24-hr session restrictions block unsolicited direct text,
  // return fallback with direct WhatsApp click-to-dispatch link
  return {
    success: true,
    method: 'whatsapp_direct',
    isDirectFallback: true,
    recipientPhone: normalizedPhone,
    whatsappDirectUrl,
    warning: lastErrorMsg || 'Meta 24-Hour window requires direct WhatsApp dispatch'
  };
}

module.exports = {
  normalizePhone,
  formatBillMessage,
  sendWatiMessage
};
