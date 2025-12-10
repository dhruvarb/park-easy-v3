import pkg from "pg";
import env from "./env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSSL ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
  process.exit(1);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
