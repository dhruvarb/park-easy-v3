import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM notifications LIMIT 5');
        console.log('Notifications table exists. Rows:', res.rows);
    } catch (err) {
        console.error('Error querying notifications:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
