
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Creating payments table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                amount NUMERIC NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('payment', 'refund')),
                status TEXT NOT NULL DEFAULT 'success',
                transaction_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log("Creating refund_requests table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS refund_requests (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                admin_response TEXT,
                refund_amount NUMERIC,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Backfill payments for existing confirmed bookings
        console.log("Backfilling payments for existing bookings...");
        await client.query(`
            INSERT INTO payments (booking_id, user_id, amount, type, status, created_at)
            SELECT id, user_id, amount_paid, 'payment', 'success', created_at
            FROM bookings
            WHERE status = 'confirmed' AND amount_paid IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log("Tables created and backfilled successfully!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
