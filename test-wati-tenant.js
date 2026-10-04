require('dotenv').config();

const token = process.env.WATI_API_TOKEN;
const testPhone = '917330789032';

// Extract potential tenantId from token: "wati_45bf03b2-b089-4c50-a472-85627a10aa9b.XXXX"
const tokenParts = token.split('.');
const prefix = tokenParts[0].replace(/^wati_/, '');

console.log('Testing with extracted tenantId:', prefix);

async function testWatiPaths() {
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const headers = {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };

  const testUrls = [
    `https://live-mt-server.wati.io/${prefix}/api/v1/sendSessionMessage/${testPhone}`,
    `https://live-mt-server.wati.io/${prefix}/api/v1/getContacts`,
    `https://live-mt-server.wati.io/api/ext/v3/messages`,
    `https://api.wati.io/api/ext/v3/messages`,
    `https://live-mt-server.wati.io/${prefix}/api/v1/sendTemplateMessage`
  ];

  for (const url of testUrls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messageText: 'Hello from ShopSahayak' })
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

testWatiPaths();
