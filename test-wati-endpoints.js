require('dotenv').config();

const token = process.env.WATI_API_TOKEN;
const testPhone = '917330789032';

const endpoints = [
  'https://app-server.wati.io',
  'https://api.wati.io',
  'https://live-mt-server.wati.io',
  'https://live-server.wati.io',
  'https://live-server-1000.wati.io',
  'https://app.wati.io'
];

async function checkEndpoints() {
  console.log('Testing WATI API endpoints for token:', token ? `${token.substring(0, 15)}...` : 'MISSING');

  for (const base of endpoints) {
    try {
      console.log(`\nTesting endpoint: ${base}...`);
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      // Check contact or send message
      const res = await fetch(`${base}/api/v1/getContacts`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[${base}] /api/v1/getContacts -> Status: ${res.status}`);
      const body = await res.text();
      console.log(`[${base}] Body: ${body.substring(0, 120)}`);
    } catch (e) {
      console.log(`[${base}] Error: ${e.message}`);
    }
  }
}

checkEndpoints();
