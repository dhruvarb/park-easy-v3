
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

const debug = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DB");

        // 1. Find the lot 'wert'
        const lotRes = await client.query("SELECT * FROM parking_lots WHERE name = 'wert'");
        if (lotRes.rows.length === 0) {
            console.log("Lot 'wert' not found. Listing all lots:");
            const allLots = await client.query("SELECT id, name FROM parking_lots LIMIT 5");
            console.table(allLots.rows);
            return;
        }

        const lot = lotRes.rows[0];
        console.log("Found Lot:", lot.name, lot.id);

        // 2. Check pricing
        console.log("\n--- Pricing ---");
        const priceRes = await client.query("SELECT * FROM slot_pricing WHERE lot_id = $1", [lot.id]);
        console.table(priceRes.rows);

        // 3. Check slots
        console.log("\n--- Slots Summary ---");
        const slotRes = await client.query("SELECT vehicle_type, count(*) FROM parking_slots WHERE lot_id = $1 GROUP BY vehicle_type", [lot.id]);
        console.table(slotRes.rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
};

debug();
