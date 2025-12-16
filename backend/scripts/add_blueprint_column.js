import pool from '../src/config/db.js';

const addBlueprintColumn = async () => {
    const client = await pool.connect();
    try {
        console.log('Adding blueprint column to parking_lots table...');
        await client.query(`
      ALTER TABLE parking_lots 
      ADD COLUMN IF NOT EXISTS blueprint TEXT;
    `);
        console.log('Successfully added blueprint column.');
    } catch (error) {
        console.error('Error adding blueprint column:', error);
    } finally {
        client.release();
        pool.end();
    }
};

addBlueprintColumn();
