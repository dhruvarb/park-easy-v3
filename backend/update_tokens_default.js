
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

        console.log("Updating default token value to 100...");
        await client.query(`
            ALTER TABLE users 
            ALTER COLUMN tokens SET DEFAULT 100;
        `);

        console.log("Backfilling existing users with 100 tokens (if they have < 100)...");
        // Only give welcome bonus to those who have 0 or null, or just reset everyone to 100+balance? 
        // User asked "tokens are not displaying... new user... awarded 100".
        // safesty: Set null or 0 to 100.
        await client.query(`
            UPDATE users 
            SET tokens = 100 
            WHERE tokens IS NULL OR tokens = 0;
        `);

        console.log("Migration successful!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

runMigration();
