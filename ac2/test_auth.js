const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAuthentication() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('🔍 Testing Authentication System...');
  
  try {
    // Test 1: Register a new user
    console.log('\n1. Testing Registration...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser2@example.com',
        password: 'securepass123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register Response:', JSON.stringify(registerData, null, 2));
    
    if (!registerData.success) {
      throw new Error('Registration failed');
    }
    
    const token = registerData.token;
    console.log('✅ Registration successful!');
    
    // Test 2: Login with the same user
    console.log('\n2. Testing Login...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser2@example.com',
        password: 'securepass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      throw new Error('Login failed');
    }
    
    console.log('✅ Login successful!');
    
    // Test 3: Verify token
    console.log('\n3. Testing Token Verification...');
    const verifyResponse = await fetch(`${baseUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verify Response:', JSON.stringify(verifyData, null, 2));
    
    if (!verifyData.success) {
      throw new Error('Token verification failed');
    }
    
    console.log('✅ Token verification successful!');
    
    // Test 4: Test protected endpoint (if any)
    console.log('\n4. Testing Health Check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health Response:', JSON.stringify(healthData, null, 2));
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    process.exit(1);
  }
}

testAuthentication(); 