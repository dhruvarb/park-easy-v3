
import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres:anything123@db.nwekabeojtidokbtqpia.supabase.co:5432/postgres";

const check = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Successfully connected to Supabase (Direct)!");

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

        console.log("Tables found:", res.rows.map(r => r.table_name));

        if (res.rows.length === 0) {
            console.log("WARNING: Database is empty! Schema has not been applied.");
        }

    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        await client.end();
    }
};

check();
