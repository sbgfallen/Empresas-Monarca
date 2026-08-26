const { Pool } = require("pg");

let pool;

function getPool() {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Neon / Railway / any cloud provider with DATABASE_URL
    const isNeon = databaseUrl.includes("neon.tech");
    console.log(`[DB] Connecting via DATABASE_URL${isNeon ? " (Neon)" : ""}`);

    pool = new Pool({
      connectionString: databaseUrl,
      // Neon requires SSL — always enable for cloud databases
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  } else {
    // Local development (no DATABASE_URL)
    console.log("[DB] Connecting to local PostgreSQL");
    pool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "premium_marketplace",
      password: process.env.DB_PASSWORD || "020222Mm.",
      port: Number(process.env.DB_PORT || 5432),
      max: 10,
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
