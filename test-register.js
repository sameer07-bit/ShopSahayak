async function testRegister() {
  console.log('Testing store registration endpoint...');
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Kirana Owner',
        storeName: 'Test ShopSahayak Store',
        email: `teststore_${Date.now()}@shopsahayak.com`,
        phone: '+919876543210',
        password: 'password123',
        storeCategory: 'Grocery & Retail'
      })
    });

    const data = await res.json();
    console.log('\n--- REGISTRATION RESPONSE ---');
    console.log('Status Code:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Registration test failed:', err.message);
  }
}

testRegister();
