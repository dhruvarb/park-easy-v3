import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
    try {
        const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Reading schema from:", schemaPath);

        const client = await pool.connect();
        console.log("Connected to DB");

        await client.query(schemaSql);
        console.log("Schema execution successful");

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Schema execution failed", err);
        process.exit(1);
    }
};

initDb();
