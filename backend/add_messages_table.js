
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
    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
                admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name TEXT,
                email TEXT,
                subject TEXT,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log("Messages table created successfully");
        client.release();
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
