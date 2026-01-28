const http = require('http');

const makeRequest = i => {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      headers: {
        'X-Health-Key': process.env.HEALTH_CHECK_SECRET || 'your_super_secret_jwt_key'
      }
    };
    http
      .get(options, res => {
        console.log(`[Request ${i}] Status: ${res.statusCode} | Remaining: ${res.headers['x-ratelimit-remaining'] || 'N/A'}`);
        resolve(res.statusCode);
      })
      .on('error', err => {
        console.error(`Request ${i} failed: ${err.message}`);
        resolve(null);
      });
  });
};

const runTest = async () => {
  console.log('🛡️ Testing Throttler (Limit: 50 requests/min)...');
  console.log('Sending 55 requests rapidly...');

  let blockedCount = 0;
  for (let i = 1; i <= 55; i++) {
    const status = await makeRequest(i);
    if (status === 429) blockedCount++;
    await new Promise(r => setTimeout(r, 10));
  }

  console.log('\n📊 Test Result:');
  console.log(`Total Requests: 55`);
  console.log(`429 Responses: ${blockedCount}`);

  if (blockedCount > 0) {
    console.log('✅ SUCCESS: Throttler correctly blocked excessive requests.');
  } else {
    console.log('❌ FAILURE: Throttler did not block any requests.');
  }
};

runTest();
