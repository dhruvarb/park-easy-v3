import pool from "../src/config/db.js";

const runMigration = async () => {
    try {
        console.log("Adding images column to parking_lots table...");
        await pool.query(`
      ALTER TABLE parking_lots 
      ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
    `);
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
};

runMigration();
