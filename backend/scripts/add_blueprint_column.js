import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjusted path to point to backend .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const addBlueprintColumn = async () => {
    const { default: pool } = await import('../src/config/db.js');
    console.log("Pool loaded");
    const client = await pool.connect();
    try {
        console.log('Adding blueprint column to parking_lots table...');
        await client.query(`
      ALTER TABLE parking_lots 
      ADD COLUMN IF NOT EXISTS blueprint TEXT;
    `);
        console.log('Successfully added blueprint column.');
    } catch (error) {
        console.error('Error adding blueprint column:', error);
    } finally {
        client.release();
        pool.end();
    }
};

addBlueprintColumn();
