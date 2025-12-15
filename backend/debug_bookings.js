
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

async function checkBookings() {
    const client = await pool.connect();
    try {
        const userRes = await client.query("SELECT id FROM users WHERE email = 'suprit@gmail.com'");
        if (userRes.rows.length === 0) {
            console.log("User not found");
            return;
        }
        const userId = userRes.rows[0].id;
        console.log("User ID:", userId);

        console.log("Running listBookings query...");
        const result = await client.query(
            `
      SELECT 
        b.id,
      b.start_time,
      b.end_time,
      b.amount_paid,
      b.status,
      b.created_at,
      pl.name as lot_name,
      pl.address,
      pl.latitude,
      pl.longitude,
      ps.vehicle_type,
      ps.is_ev,
      (SELECT status FROM refund_requests rr WHERE rr.booking_id = b.id LIMIT 1) as refund_status
      FROM bookings b
      JOIN parking_slots ps ON b.slot_id = ps.id
      JOIN parking_lots pl ON ps.lot_id = pl.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `,
            [userId]
        );

        console.log(`Query returned ${result.rows.length} rows.`);
        result.rows.forEach(row => {
            console.log(JSON.stringify(row, null, 2));
        });

    } catch (err) {
        console.error("Error querying bookings:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkBookings();
