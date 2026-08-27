const db = require("../config/db");

let setupPromise;

async function ensureSectionsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS homepage_sections (
          id SERIAL PRIMARY KEY, type TEXT NOT NULL, title TEXT, subtitle TEXT,
          description TEXT, content JSONB, visible BOOLEAN NOT NULL DEFAULT true,
          "order" INTEGER NOT NULL DEFAULT 0, deleted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_sections_order ON homepage_sections("order")`);
    })();
  }
  return setupPromise;
}

async function listSections({ publicOnly = false } = {}) {
  await ensureSectionsTable();
  let query = 'SELECT * FROM homepage_sections WHERE deleted_at IS NULL';
  if (publicOnly) query += " AND visible = true";
  query += ' ORDER BY "order" ASC, created_at ASC';
  const result = await db.query(query);
  return result.rows;
}

async function getSectionById(id) {
  await ensureSectionsTable();
  const result = await db.query('SELECT * FROM homepage_sections WHERE id = $1 AND deleted_at IS NULL', [id]);
  return result.rows[0] || null;
}

async function createSection(input) {
  await ensureSectionsTable();
  const result = await db.query(
    `INSERT INTO homepage_sections (type, title, subtitle, description, content, visible, "order")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [input.type, input.title || null, input.subtitle || null, input.description || null,
     input.content ? JSON.stringify(input.content) : null, input.visible ?? true, input.order ?? 0]
  );
  return result.rows[0];
}

async function updateSection(id, input) {
  await ensureSectionsTable();
  const fields = []; const values = []; let pi = 1;
  if (input.type !== undefined) { fields.push(`type = $${pi}`); values.push(input.type); pi++; }
  if (input.title !== undefined) { fields.push(`title = $${pi}`); values.push(input.title); pi++; }
  if (input.subtitle !== undefined) { fields.push(`subtitle = $${pi}`); values.push(input.subtitle); pi++; }
  if (input.description !== undefined) { fields.push(`description = $${pi}`); values.push(input.description); pi++; }
  if (input.content !== undefined) { fields.push(`content = $${pi}`); values.push(JSON.stringify(input.content)); pi++; }
  if (input.visible !== undefined) { fields.push(`visible = $${pi}`); values.push(input.visible); pi++; }
  if (input.order !== undefined) { fields.push(`"order" = $${pi}`); values.push(input.order); pi++; }
  if (fields.length === 0) return null;
  fields.push(`updated_at = NOW()`); values.push(id);
  const result = await db.query(`UPDATE homepage_sections SET ${fields.join(", ")} WHERE id = $${pi} AND deleted_at IS NULL RETURNING *`, values);
  return result.rows[0] || null;
}

async function reorderSections(ids) {
  await ensureSectionsTable();
  for (let i = 0; i < ids.length; i++) {
    await db.query('UPDATE homepage_sections SET "order" = $1, updated_at = NOW() WHERE id = $2', [i, ids[i]]);
  }
}

async function deleteSection(id) {
  await ensureSectionsTable();
  await db.query("UPDATE homepage_sections SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
}

const SECTION_TYPES = [
  { type: "HERO", label: "Hero / Banner Principal" },
  { type: "FEATURED", label: "Productos Destacados" },
  { type: "CATEGORIES", label: "Categorías" },
  { type: "PROMOTIONS", label: "Promociones" },
  { type: "NEWS", label: "Noticias / Blog" },
  { type: "GALLERY", label: "Galería" },
  { type: "CONTACT", label: "Contacto" },
];

module.exports = { ensureSectionsTable, listSections, getSectionById, createSection, updateSection, reorderSections, deleteSection, SECTION_TYPES };
