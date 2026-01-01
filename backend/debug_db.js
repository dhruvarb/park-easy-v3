
import pkg from 'pg';
import env from './src/config/env.js';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: env.dbSSL ? { rejectUnauthorized: false } : false,
});

const checkSchema = async () => {
    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        // Check users table columns
        const userCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public';
    `);
        console.log("Public Users table columns:", userCols.rows.map(r => r.column_name));

        // Check Parking_lots table columns
        const lotCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parking_lots' AND table_schema = 'public';
    `);
        console.log("Public Parking_lots table columns:", lotCols.rows.map(r => r.column_name));

        // Check parking_slots
        const slotCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'parking_slots'`);
        console.log("Parking Slots:", slotCols.rows.map(r => r.column_name));

        // Check bookings
        const bookingCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'`);
        console.log("Bookings:", bookingCols.rows.map(r => r.column_name));

        // Check refund_requests
        const refundCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'refund_requests'`);
        console.log("Refund Requests:", refundCols.rows.map(r => r.column_name));

        client.release();
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        pool.end();
    }
};

checkSchema();
