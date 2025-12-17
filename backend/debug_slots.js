import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Local .env

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSlots() {
    try {
        const res = await pool.query(`
      SELECT pl.name, s.id, s.label, s.vehicle_type, s.x, s.y 
      FROM parking_slots s 
      JOIN parking_lots pl ON s.lot_id = pl.id 
      WHERE pl.name ILIKE '%railwaystation%'
    `);

        console.log("Lot Query Result for 'railwaystation':");
        console.log("Total Slots found:", res.rows.length);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSlots();
