const { Pool } = require('pg');

// This script simulates a deadlock in PostgreSQL to verify our transaction retry logic.
async function simulateDeadlock() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    };

    const pool = new Pool(config);

    console.log('🚀 Starting deadlock simulation...');

    // We need two sessions to create a deadlock
    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
        // Setup: Create two accounts
        await client1.query('BEGIN');
        await client1.query('CREATE TABLE IF NOT EXISTS test_accounts (id INT PRIMARY KEY, balance INT)');
        await client1.query('INSERT INTO test_accounts (id, balance) VALUES (1, 100), (2, 100) ON CONFLICT (id) DO UPDATE SET balance = 100');
        await client1.query('COMMIT');

        console.log('✅ Accounts created. Initiating cross-locks...');

        // Transaction 1: Locks Account 1
        await client1.query('BEGIN');
        await client1.query('SELECT * FROM test_accounts WHERE id = 1 FOR UPDATE');
        console.log('🔒 Session 1 locked Account 1');

        // Transaction 2: Locks Account 2
        await client2.query('BEGIN');
        await client2.query('SELECT * FROM test_accounts WHERE id = 2 FOR UPDATE');
        console.log('🔒 Session 2 locked Account 2');

        // Transaction 1: Tries to lock Account 2 (this will wait)
        const t1Promise = client1.query('SELECT * FROM test_accounts WHERE id = 2 FOR UPDATE').catch(e => e);
        console.log('⏳ Session 1 waiting for Account 2...');

        // Transaction 2: Tries to lock Account 1 (this will trigger DEADLOCK)
        console.log('💥 Session 2 trying to lock Account 1. This should trigger a deadlock!');
        const t2Error = await client2.query('SELECT * FROM test_accounts WHERE id = 1 FOR UPDATE').catch(e => e);

        const t1Result = await t1Promise;

        console.log('--- Results ---');
        console.log('Session 2 Result:', t2Error.code === '40P01' ? 'DEADLOCK DETECTED (EXPECTED)' : t2Error);
        
        if (t2Error.code === '40P01') {
            console.log('✅ Deadlock successfully simulated.');
        } else {
            console.error('❌ Failed to simulate deadlock.');
        }

    } finally {
        await client1.query('ROLLBACK').catch(() => {});
        await client2.query('ROLLBACK').catch(() => {});
        client1.release();
        client2.release();
        await pool.end();
    }
}

simulateDeadlock().catch(console.error);
