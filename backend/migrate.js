import pool from './src/config/db.js';

const migrate = async () => {
    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        await client.query(`
      ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS capacity_breakdown JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
    `);

        console.log("Migration successful");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed", err);
        process.exit(1);
    }
};

migrate();
