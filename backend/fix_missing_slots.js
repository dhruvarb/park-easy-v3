
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixSlots() {
    const client = await pool.connect();
    try {
        console.log("Fixing missing slots for existing lots...");

        const lotsRes = await client.query("SELECT id, capacity_breakdown, has_ev FROM parking_lots");

        for (const lot of lotsRes.rows) {
            const lotId = lot.id;
            const breakdown = lot.capacity_breakdown || {};

            console.log(`Processing lot ${lotId}...`);

            for (const [type, count] of Object.entries(breakdown)) {
                const currentSlotsRes = await client.query(
                    `SELECT count(*) FROM parking_slots WHERE lot_id = $1 AND vehicle_type = $2`,
                    [lotId, type]
                );
                const currentCount = parseInt(currentSlotsRes.rows[0].count);
                const targetCount = parseInt(count);

                if (targetCount > currentCount) {
                    const needed = targetCount - currentCount;
                    console.log(`  Adding ${needed} slots for ${type}`);
                    for (let i = 0; i < needed; i++) {
                        await client.query(
                            `INSERT INTO parking_slots (lot_id, vehicle_type, label, is_available, is_ev)
                             VALUES ($1, $2, $3, true, $4)`,
                            [
                                lotId,
                                type,
                                `${type.toUpperCase()}-${currentCount + i + 1}`,
                                lot.has_ev
                            ]
                        );
                    }
                } else {
                    console.log(`  Slots for ${type} are sufficient (${currentCount} >= ${targetCount})`);
                }
            }
        }

        console.log("Slot fix complete!");
    } catch (err) {
        console.error("Fix failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixSlots();
