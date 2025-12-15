
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

        // 1. Check all available vehicle types in pricing
        console.log("\n--- All Vehicle Types in Pricing ---");
        const typesRes = await client.query("SELECT DISTINCT vehicle_type FROM slot_pricing");
        console.table(typesRes.rows);

        // 2. Check lots that HAVE 'ev_car' or 'ev_bike' pricing
        console.log("\n--- Lots with EV pricing ---");
        const evLots = await client.query("SELECT pl.id, pl.name, pl.city, sp.vehicle_type FROM parking_lots pl JOIN slot_pricing sp ON sp.lot_id = pl.id WHERE sp.vehicle_type IN ('ev_car', 'ev_bike', 'evCar', 'evBike')");
        console.table(evLots.rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
};

debug();
