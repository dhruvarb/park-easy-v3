import pkg from "pg";
import env from "./env.js";

const { Pool } = pkg;

let pool;

if (!pool) {
  pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: env.dbSSL ? { rejectUnauthorized: false } : undefined,
    max: 10, // Increased from 1
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased from 2000
  });
}

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
