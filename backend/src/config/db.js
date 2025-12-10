import pkg from "pg";
import env from "./env.js";

const { Pool } = pkg;

let pool;

if (!pool) {
  pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: env.dbSSL ? { rejectUnauthorized: false } : undefined,
    max: 1, // Limit connections in serverless to avoid exhausting Supabase limits
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
