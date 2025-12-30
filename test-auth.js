const fetch = require('node-fetch'); // You might need to install node-fetch if not available, or use built-in fetch in Node 18+

async function testAuth() {
  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  const email = `testuser_${timestamp}@example.com`;
  const password = 'password123';
  const name = `Test User ${timestamp}`;

  console.log(`\n--- Testing Registration ---`);
  console.log(`Registering user: ${email}`);
  
  try {
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const registerData = await registerRes.json();
    console.log('Status:', registerRes.status);
    console.log('Response:', registerData);

    if (registerRes.status !== 200) {
      console.error('Registration failed, stopping test.');
      return;
    }

    console.log(`\n--- Testing Login ---`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', loginData);

    if (loginData.token) {
        console.log('\nSUCCESS: Token received!');
    } else {
        console.log('\nFAILURE: No token received.');
    }

  } catch (error) {
    console.error('Error during test:', error.message);
    console.log('Make sure the server is running on http://localhost:3000');
  }
}

testAuth();
