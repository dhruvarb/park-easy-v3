import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create notifications table
        await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL, -- 'booking_reminder', 'promotion', 'payment_confirmed', 'info'
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        action_label TEXT,
        action_url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        // Seed some sample notifications for all existing users
        const users = await client.query('SELECT id FROM users');

        for (const user of users.rows) {
            await client.query(`
            INSERT INTO notifications (user_id, type, title, message, action_label, action_url, created_at)
            VALUES 
            ($1, 'booking_reminder', 'Booking Reminder', 'Your parking at Central Garage starts in 2 hours', 'View Booking', '/bookings', NOW() - INTERVAL '1 hour'),
            ($1, 'promotion', 'New Promotion Available', 'Get 20% off your next booking with code SAVE20', 'View Promotions', '/promotions', NOW() - INTERVAL '3 hours'),
            ($1, 'payment_confirmed', 'Payment Confirmed', 'Payment for your parking at City Center Lot was successful', NULL, NULL, NOW() - INTERVAL '1 day')
            ON CONFLICT DO NOTHING;
        `, [user.id]);
        }

        console.log('Notifications table created and seeded successfully');
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
