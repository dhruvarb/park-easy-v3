
import pkg from 'pg';
const { Client } = pkg;

// Using the provided Transaction Pooler URL
const connectionString = "postgresql://postgres.nwekabeojtidokbtqpia:anything123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const resetData = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to Supabase...");
        await client.connect();

        console.log("⚠️  DELETING ALL USERS AND PARKING DATA...");

        // Truncate main tables with CASCADE to clean up all related data (bookings, slots, reviews, etc.)
        await client.query(`
            TRUNCATE TABLE users, parking_lots RESTART IDENTITY CASCADE;
        `);

        console.log("✅ Database cleared successfully!");
        console.log("All users, parking lots, bookings, and transactions have been removed.");

    } catch (err) {
        console.error("Reset failed:", err);
    } finally {
        await client.end();
    }
};

resetData();
