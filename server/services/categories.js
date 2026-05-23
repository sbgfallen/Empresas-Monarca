const db = require("../config/db");

let setupPromise;

async function ensureCategoriesTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Seed default categories if table is empty
      const count = await db.query("SELECT COUNT(*) FROM categories");
      if (parseInt(count.rows[0].count) === 0) {
        await db.query(`
          INSERT INTO categories (name, slug) VALUES
            ('Electrodomésticos', 'electrodomesticos'),
            ('Muebles', 'muebles'),
            ('Tecnología', 'tecnologia'),
            ('Inmuebles', 'inmuebles'),
            ('Fletes', 'fletes'),
            ('Préstamos', 'prestamos')
          ON CONFLICT (slug) DO NOTHING
        `);
      }
    })();
  }
  return setupPromise;
}

// ─── CRUD ─────────────────────────────────────────────

async function getAllCategories() {
  await ensureCategoriesTable();
  const result = await db.query(
    "SELECT * FROM categories ORDER BY name ASC"
  );
  return result.rows;
}

async function createCategory({ name }) {
  await ensureCategoriesTable();
  const slug = name
    .toLowerCase()
    .replace(/[^a-záéíóúñ0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const result = await db.query(
    `INSERT INTO categories (name, slug)
     VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = $1
     RETURNING *`,
    [name, slug]
  );
  return result.rows[0];
}

async function deleteCategory(id) {
  await ensureCategoriesTable();
  await db.query("DELETE FROM categories WHERE id = $1", [id]);
  return { success: true };
}

module.exports = {
  ensureCategoriesTable,
  getAllCategories,
  createCategory,
  deleteCategory,
};
