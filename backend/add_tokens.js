
import pkg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pkg;

// Using the provided Transaction Pooler URL
const connectionString = "postgresql://postgres.nwekabeojtidokbtqpia:anything123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const runMigration = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to Supabase...");
        await client.connect();

        console.log("Adding tokens column to users table...");
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0;
        `);

        console.log("Creating token_transactions table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS token_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                amount INTEGER NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log("Adding penalty and actual_end_time to bookings table...");
        await client.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS penalty_paid INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ;
        `);

        console.log("Migration successful!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

runMigration();
