
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to backend .env (one level up from scripts)
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log("Adding columns to parking_slots table...");

        await client.query("BEGIN");

        // Add 'x' column
        await client.query(`
            ALTER TABLE parking_slots 
            ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0
        `);
        console.log("Added column: x");

        // Add 'y' column
        await client.query(`
            ALTER TABLE parking_slots 
            ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0
        `);
        console.log("Added column: y");

        // Add 'rotation' column
        await client.query(`
            ALTER TABLE parking_slots 
            ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0
        `);
        console.log("Added column: rotation");

        // Add 'is_active' column logic (optional soft delete)
        await client.query(`
            ALTER TABLE parking_slots 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        `);
        console.log("Added column: is_active");

        await client.query("COMMIT");
        console.log("Migration successful!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
