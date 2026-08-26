const db = require("../config/db");

let setupPromise;

async function ensureProductsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          price NUMERIC NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          image TEXT DEFAULT '',
          category TEXT DEFAULT 'general',
          financing TEXT DEFAULT '',
          down_payment NUMERIC DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_products_category
        ON products(category)
      `);
    })();
  }
  return setupPromise;
}

module.exports = {
  ensureProductsTable,
};
