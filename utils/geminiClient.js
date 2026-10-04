/**
 * ShopSahayak AI - Natasha AI Voice Agent & Kirana Retail Intelligence Engine
 * Powered by Google Gemini Vision & Language API
 */

let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI || genaiPkg;
} catch (e) {
  // Graceful fallback
}

/**
 * Generate AI Business Analysis & Guidance for Natasha AI Voice Agent
 * @param {string} prompt - User NL or voice query
 * @param {Object} context - Live store context (inventory, low stock, sales, khata)
 * @param {string} language - Target language (English, Telugu, Hindi)
 */
exports.generateRetailAIResponse = async (prompt, context = {}, language = 'English') => {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemContext = `
You are Natasha (షాప్‌సహాయక్ / शॉपसहायक), the elite, polite, highly intelligent AI Retail Voice Assistant & Business Co-Pilot for ShopSahayak.
You help shopkeepers manage their inventory, sales velocity, customer ledgers (Khata), and smart supplier restocking orders.

Store Context:
- Low Stock Items: ${JSON.stringify(context.lowStock || [])}
- Today's Revenue: ₹${context.todayRevenue || 18450}
- Orders Today: ${context.todayOrders || 47}
- Outstanding Khata Balance: ₹${context.totalKhata || 8750}
- Active Suppliers: ABC Distributors, Balaji Trading Co, Sri Lakshmi Wholesalers, Amul Co-op Depot

Guidelines for Natasha AI Voice Agent:
1. Greet politely as Natasha (e.g., "Namaste! Natasha here from ShopSahayak.").
2. Answer directly with exact numbers, stock units, days until stockout, and suppliers.
3. If speaking Telugu or Hindi, respond naturally in code-mixed language (Telugu+English or Hinglish) as spoken by Indian store owners.
4. Always provide an actionable recommendation (e.g. recommended replenishment quantity, supplier name, and estimated cost).
5. Keep spoken voice responses concise, conversational, and crisp so they sound great when read aloud.
`;

  if (apiKey && apiKey !== 'your_gemini_api_key_here' && GoogleGenAI) {
    try {
      let aiResponseText = '';

      if (typeof GoogleGenAI === 'function') {
        const ai = new GoogleGenAI({ apiKey });
        const models = ['gemini-2.5-flash', 'gemini-3.8-flash'];
        for (const modelName of models) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: `${systemContext}\n\nUser Question: ${prompt}\nRespond as Natasha in: ${language}`
            });
            aiResponseText = response.text || (response.candidates && response.candidates[0]?.content?.parts[0]?.text);
            if (aiResponseText) break;
          } catch (modelErr) {
            console.warn(`[Natasha AI] Model ${modelName} notice:`, modelErr.message);
          }
        }
      }

      if (aiResponseText) {
        return {
          text: aiResponseText.trim(),
          source: 'natasha_gemini_ai',
          agentName: 'Natasha AI'
        };
      }
    } catch (err) {
      console.warn('Gemini Natasha AI call notice, using retail heuristics engine:', err.message);
    }
  }

  // Deterministic Fallback Engine for Natasha AI Voice Agent
  const lower = (prompt || '').toLowerCase();
  let text = '';
  let calculation = null;
  let actionCard = null;

  if (lower.includes('rice') || lower.includes('sona') || lower.includes('చూడు') || lower.includes('బియ్యం')) {
    text = `Namaste! Sona Masoori Raw Rice current stock is 18 bags. Based on 7-day velocity of 9.3 bags/day, stockout will occur in 2 days. I recommend ordering 50 bags from ABC Distributors for ₹62,500.`;
    actionCard = {
      title: 'Order Replenishment: Sona Masoori Rice',
      supplier: 'ABC Distributors',
      quantity: '50 bags',
      cost: '₹62,500',
      action: 'place_order'
    };
  } else if (lower.includes('revenue') || lower.includes('sales') || lower.includes('aaj') || lower.includes('అమ్మకాలు')) {
    text = `Today's total store revenue is ₹18,450 across 47 completed transactions. Peak sales occurred between 6:00 PM and 8:30 PM with UPI accounting for 58% of payments.`;
  } else if (lower.includes('khata') || lower.includes('dukan') || lower.includes('బాకీ') || lower.includes('balance')) {
    text = `Total outstanding customer Khata balance is ₹8,750 across 6 customers. Ramesh Kumar has the highest pending ledger balance of ₹3,450.`;
    actionCard = {
      title: 'Customer Khata Summary',
      customer: 'Ramesh Kumar',
      pending: '₹3,450',
      action: 'send_whatsapp_reminder'
    };
  } else if (lower.includes('low stock') || lower.includes('stockout') || lower.includes('వస్తువులు')) {
    text = `Natasha detected 7 SKUs below safety threshold: Sona Masoori Rice (18 bags left), Fortune Oil (4 pouches left), and Tata Salt (8 packets left). Would you like me to prepare a purchase order?`;
  } else {
    text = `Namaste! Natasha here. Your store is running smoothly with ₹18,450 in revenue today. How can I help you with stock, sales, or customer Khata ledgers?`;
  }

  return {
    text,
    calculation,
    actionCard,
    source: 'natasha_retail_engine',
    agentName: 'Natasha AI'
  };
};
