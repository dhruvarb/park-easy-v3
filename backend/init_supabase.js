
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using the provided Transaction Pooler URL
const connectionString = "postgresql://postgres.nwekabeojtidokbtqpia:anything123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const runMigration = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to Supabase (Pooler)...");
        await client.connect();
        console.log("Connected!");

        // Check if tables exist
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

        console.log("Existing tables:", res.rows.map(r => r.table_name));

        if (res.rows.length === 0) {
            console.log("Database is empty. Applying schema...");
            const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');

            // Supabase transaction pooler doesn't support multi-statement transactions in the same way sometimes,
            // but simple script execution usually works.
            await client.query(schemaSql);
            console.log("Schema applied successfully!");
        } else {
            console.log("Database already has tables. Skipping init.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
};

runMigration();
