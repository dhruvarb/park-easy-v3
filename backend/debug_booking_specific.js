
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

async function checkBooking() {
    const client = await pool.connect();
    try {
        const bookingId = 'e076dd7f-5b72-4e1e-9d71-91dc123f678f';
        console.log(`Checking booking ${bookingId}...`);

        const res = await client.query(`
            SELECT b.id, b.status, b.start_time, b.user_id, u.email
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = $1
        `, [bookingId]);

        if (res.rows.length === 0) {
            console.log("Booking NOT found.");
        } else {
            console.log("Booking found:", JSON.stringify(res.rows[0], null, 2));
        }

    } catch (err) {
        console.error("Error querying bookings:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkBooking();
