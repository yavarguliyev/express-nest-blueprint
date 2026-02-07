const http = require('http');

const request = (method, path, body, token) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const testCircuitBreaker = async () => {
  console.log('⚡ Starting Circuit Breaker Test...');

  const email = `test-cb-${Date.now()}@example.com`;
  console.log(`👤 Registering test user: ${email}`);
  const regRes = await request('POST', '/api/v1/auth/register', {
    email,
    password: 'password123',
    firstName: 'Circuit',
    lastName: 'Breaker'
  });

  if (regRes.status !== 200 && regRes.status !== 201) {
    console.error('❌ Registration failed:', regRes.data);
    return;
  }

  const loginRes = await request('POST', '/api/v1/auth/login', { email, password: 'password123' });
  const loginData = JSON.parse(loginRes.data);
  const token = loginData.data?.accessToken;
  
  if (!token) {
    console.error('❌ Login failed:', loginData);
    return;
  }
  console.log('🔑 Authenticated.');

  console.log('\n--- Inducing Failures ---');
  for (let i = 1; i <= 10; i++) {
    const res = await request('GET', '/api/v1/users', null, token);
    const isError = res.status >= 400;
    const data = JSON.parse(res.data);
    
    console.log(`[Request ${i}] Status: ${res.status} | Message: ${data.message || 'SUCCESS'}`);

    if (res.status === 503 && data.message.includes('Circuit breaker is OPEN')) {
      console.log('\n✅ SUCCESS: Circuit Breaker is OPEN and protecting the system!');
      return;
    }
  }

  console.log('\n❌ FAILURE: Circuit Breaker did not open.');
};

testCircuitBreaker();
