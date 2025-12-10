import pool from './src/config/db.js';

const checkSchema = async () => {
    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parking_lots';
    `);

        console.log("Columns in parking_lots:");
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Check failed", err);
        process.exit(1);
    }
};

checkSchema();
