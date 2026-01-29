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
        'X-Health-Key': process.env.HEALTH_CHECK_SECRET || 'your_super_secret_jwt_key'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        const duration = (Date.now() - start) / 1000;
        resolve({ status: res.statusCode, data: data, duration });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const stressTest = async () => {
  console.log('🏁 Preparing Stress Test...');

  const email = `test-admin-${Date.now()}@example.com`;
  console.log(`👤 Registering test admin user: ${email}`);
  const regRes = await request('POST', '/api/v1/auth/register', {
    email,
    password: 'Password123!',
    firstName: 'Stress',
    lastName: 'Tester',
    role: 'admin'
  });

  if (regRes.status !== 201 && regRes.status !== 200) {
    console.error('❌ Failed to register user:', regRes.data);
    return;
  }

  const authData = JSON.parse(regRes.data).data;
  const token = authData.accessToken;
  console.log('🔑 Obtained JWT successfully.');

  console.log('\n🔥 Starting Stress Test: 5 concurrent heavy requests (Authenticated & Cache-Bypassed)...');

  const startTime = Date.now();

  const pages = [1, 2, 3, 4, 5];
  const requests = pages.map(page => {
    const uniquePage = page + Math.floor(Math.random() * 100000);
    console.log(`[${new Date().toLocaleTimeString()}] 🚀 Sending request for page ${uniquePage}...`);
    return request('GET', `/api/v1/users?page=${uniquePage}`, null, token).then(res => {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Request for page ${uniquePage} completed in ${res.duration}s (Status: ${res.status})`);
      return res;
    });
  });

  setTimeout(async () => {
    console.log('\n🧐 Checking API responsiveness while workers are busy (at 8s mark)...');
    const health = await request('GET', '/api/v1/health');
    const hData = JSON.parse(health.data);
    console.log(`🏥 Health Check Status: ${health.status}`);
    console.log('📊 Current Queue Status (expect active jobs):', JSON.stringify(hData.data.components.queues.items, null, 2));
    console.log('');
  }, 8000);

  const results = await Promise.all(requests);

  const totalDuration = (Date.now() - startTime) / 1000;
  console.log(`\n🏆 Stress Test Finished! Total duration: ${totalDuration}s`);
  console.log('NOTE: Since each task has a 15s delay, and we have parallel workers, the total time should be ~15-18s.');

  const allSuccess = results.every(r => r.status === 200);
  if (allSuccess) {
    console.log('✨ ALL REQUESTS SUCCESSFUL! Concurrency validated.');
  } else {
    console.log('⚠️ Some requests failed. Review logs above.');
  }
};

stressTest().catch(console.error);
