import dotenv from "dotenv";

dotenv.config();

const requiredKeys = ["DATABASE_URL", "JWT_SECRET"];
const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  dbSSL: process.env.DB_SSL === "true",
  jwtSecret: process.env.JWT_SECRET,
  tokenTtlHours: Number(process.env.TOKEN_TTL_HOURS || 12),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  }
};

export default env;
