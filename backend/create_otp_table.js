
import { query } from './src/config/db.js';

const createTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                email VARCHAR(255) PRIMARY KEY,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL
            );
        `);
        console.log("Table otp_verifications created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
};

createTable();
