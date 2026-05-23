const { Pool } = require("pg");

let pool;

function getPool() {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    // Railway provides DATABASE_URL
    console.log("[DB] Connecting via DATABASE_URL");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } else {
    // Local development
    pool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "premium_marketplace",
      password: process.env.DB_PASSWORD || "020222Mm.",
      port: Number(process.env.DB_PORT || 5432),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  // Log pool errors so they don't crash the app silently
  pool.on("error", (err) => {
    console.error("[DB] Unexpected pool error:", err.message);
  });

  return pool;
}

module.exports = getPool();
