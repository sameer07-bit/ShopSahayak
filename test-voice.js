async function testNatashaVoiceAgent() {
  console.log('Testing Natasha AI Voice & Video Virtual Avatar endpoints...');
  try {
    const res = await fetch('http://127.0.0.1:5000/api/voice/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Namaste Natasha, Sona Masoori Rice entha undi?',
        language: 'Telugu + English'
      })
    });

    const data = await res.json();
    console.log('\n--- NATASHA AI VOICE RESPONSE ---');
    console.log('Status Code:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    // Test Avatar Session Endpoint
    const avatarRes = await fetch('http://127.0.0.1:5000/api/voice/avatar-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: 'shopsahayak-voice', session_id: 'test-video-session' })
    });
    const avatarData = await avatarRes.json();
    console.log('\n--- BEYOND PRESENCE NATASHA AVATAR SESSION ---');
    console.log('Avatar Status:', avatarRes.status);
    console.log('Avatar Data:', JSON.stringify(avatarData, null, 2));

  } catch (err) {
    console.error('Voice test failed:', err.message);
  }
}

testNatashaVoiceAgent();
