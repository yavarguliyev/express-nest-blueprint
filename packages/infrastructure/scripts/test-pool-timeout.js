const axios = require('axios');

const API_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 15;

async function runTest() {
  console.log(`🚀 Testing Pool Timeout with ${CONCURRENT_REQUESTS} concurrent requests...`);
  console.log(`ℹ️  Note: UsersService has a 15s delay. Pool max is 10. Connection timeout is 2s.`);

  const start = Date.now();
  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
    return axios
      .get(`${API_URL}/health`, {
        headers: {
          'X-Health-Key': process.env.HEALTH_CHECK_SECRET || 'your_super_secret_jwt_key'
        }
      })
      .then(res => ({ id: i + 1, status: res.status, time: Date.now() - start }))
      .catch(err => ({ id: i + 1, status: err.response?.status || err.code, time: Date.now() - start, error: err.message }));
  });
}
