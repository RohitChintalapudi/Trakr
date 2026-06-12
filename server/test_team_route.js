const axios = require('axios');

async function testRoute() {
  try {
    // 1. Login
    console.log('Logging in as owner@nighatech.com...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'owner@nighatech.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful! Token:', token.substring(0, 30) + '...');

    // 2. Fetch /checkin/team
    console.log('Fetching /api/checkin/team...');
    const teamRes = await axios.get('http://localhost:5000/api/checkin/team', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Response status: ${teamRes.status}`);
    console.log(`Check-ins count returned: ${teamRes.data.length}`);
    if (teamRes.data.length > 0) {
      console.log('Sample check-in:', JSON.stringify(teamRes.data[0], null, 2));
    }
  } catch (error) {
    console.error('Request failed:', error.response ? error.response.data : error.message);
  }
}

testRoute();
