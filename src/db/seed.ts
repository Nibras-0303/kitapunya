import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";
import { seedDb } from "../services/db.js";

dotenv.config();

const { Pool } = pg;

async function runSeed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL environment variable is not defined");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL Supabase database to run seed...");
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool, { schema });

  try {
    await seedDb(db);
  } catch (error) {
    console.error("Seed execution failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
