
import pkg from 'pg';
const { Client } = pkg;

const createDb = async () => {
    const client = new Client({
        connectionString: "postgres://postgres:anything123@localhost:5432/postgres"
    });

    try {
        await client.connect();
        console.log("Connected to postgres DB");

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'park_easy'");
        if (res.rowCount === 0) {
            await client.query("CREATE DATABASE park_easy");
            console.log("Database park_easy created");
        } else {
            console.log("Database park_easy already exists");
        }
    } catch (err) {
        console.error("Error creating DB:", err);
    } finally {
        await client.end();
    }
};

createDb();
