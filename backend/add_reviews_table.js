import pool from './src/config/db.js';

const createReviewsTable = async () => {
    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        console.log("Reviews table created successfully");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Failed to create reviews table", err);
        process.exit(1);
    }
};

createReviewsTable();
