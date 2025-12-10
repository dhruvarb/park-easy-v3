
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
      WHERE table_name = 'users';
    `);
        console.log("Users table columns:", userCols.rows.map(r => r.column_name));

        // Check parking_lots table columns
        const lotCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parking_lots';
    `);
        console.log("Parking_lots table columns:", lotCols.rows.map(r => r.column_name));

        // Check notifications table columns
        const notifCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications';
    `);
        console.log("Notifications table columns:", notifCols.rows.map(r => r.column_name));

        client.release();
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        pool.end();
    }
};

checkSchema();
