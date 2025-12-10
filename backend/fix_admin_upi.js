
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

async function fixAdmin() {
    const client = await pool.connect();
    try {
        const email = 'krishna@gmail.com';
        const upiId = 'krishna@upi'; // Default/Placeholder

        console.log(`Checking UPI ID for ${email}...`);
        const res = await client.query("SELECT id, upi_id FROM users WHERE email = $1", [email]);

        if (res.rows.length === 0) {
            console.log("User not found!");
            return;
        }

        const user = res.rows[0];
        console.log(`Current UPI ID: ${user.upi_id}`);

        if (!user.upi_id) {
            console.log(`Updating UPI ID to ${upiId}...`);
            await client.query("UPDATE users SET upi_id = $1 WHERE id = $2", [upiId, user.id]);
            console.log("Update successful!");
        } else {
            console.log("UPI ID is already set.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixAdmin();
