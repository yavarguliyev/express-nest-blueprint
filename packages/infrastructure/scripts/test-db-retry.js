require('reflect-metadata');
const { PostgreSQLAdapter } = require('../dist/core/database/adapters/postgresql.adapter');
const { TransactionAdapter } = require('../dist/core/database/adapters/transaction.adapter');

// Mocking 'pg' module behavior
class MockClient {
    async query(sql) {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return {};
        return { rows: [], rowCount: 0 };
    }
    release() {}
}

async function testTransactionRetry() {
    console.log('🧪 Testing transactionWithRetry persistence (Mocked)...');

    const config = { host: 'mock', type: 'postgresql' };
    const adapter = new PostgreSQLAdapter(config);

    // Injecting a mock pool
    adapter.pool = {
        async connect() {
            return new MockClient();
        }
    };

    let attempts = 0;
    try {
        const result = await adapter.transactionWithRetry(async (tx) => {
            attempts++;
            console.log(`🏃 Attempt ${attempts}...`);
            
            if (attempts < 3) {
                console.log('❌ Simulating deadlock error (40P01)...');
                const error = new Error('deadlock detected');
                error.code = '40P01'; 
                throw error;
            }

            console.log('✅ Final attempt success!');
            return 'SUCCESS';
        }, 5);

        console.log('Final Result:', result);
        if (result === 'SUCCESS' && attempts === 3) {
            console.log('✨ SUCCESS: transactionWithRetry recovered after 2 deadlock failures.');
        } else {
            console.error('❌ FAILURE: Unexpected behavior.');
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ FAILURE: Transaction failed:', e);
        process.exit(1);
    }
}

testTransactionRetry().catch(err => {
    console.error(err);
    process.exit(1);
});
