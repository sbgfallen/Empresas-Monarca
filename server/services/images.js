const db = require("../config/db");

let setupPromise;

async function ensureImagesTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL DEFAULT '',
          url TEXT NOT NULL,
          alt TEXT DEFAULT '',
          category TEXT DEFAULT 'general',
          width INTEGER DEFAULT 0,
          height INTEGER DEFAULT 0,
          file_size INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_images_category
        ON images(category)
      `);
    })();
  }
  return setupPromise;
}

// ─── Public ───────────────────────────────────────────

async function getImagesByCategory(category) {
  await ensureImagesTable();
  const result = await db.query(
    "SELECT * FROM images WHERE category = $1 ORDER BY created_at DESC",
    [category]
  );
  return result.rows;
}

// ─── Admin CRUD ───────────────────────────────────────

async function getAllImages() {
  await ensureImagesTable();
  const result = await db.query(
    "SELECT * FROM images ORDER BY created_at DESC"
  );
  return result.rows;
}

async function getImageById(id) {
  await ensureImagesTable();
  const result = await db.query("SELECT * FROM images WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createImage({ filename, originalName, url, alt, category, width, height, fileSize }) {
  await ensureImagesTable();
  const result = await db.query(
    `INSERT INTO images (filename, original_name, url, alt, category, width, height, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      filename,
      originalName || filename,
      url,
      alt || "",
      category || "general",
      width || 0,
      height || 0,
      fileSize || 0,
    ]
  );
  return result.rows[0];
}

async function updateImage(id, fields) {
  await ensureImagesTable();
  const sets = [];
  const params = [];
  let idx = 1;

  const fieldMap = {
    alt: "alt",
    category: "category",
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      const col = fieldMap[key] || key.replace(/([A-Z])/g, "_$1").toLowerCase();
      sets.push(`${col} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  if (sets.length === 0) return null;
  params.push(id);

  const result = await db.query(
    `UPDATE images SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteImage(id) {
  await ensureImagesTable();
  await db.query("DELETE FROM images WHERE id = $1", [id]);
  return { success: true };
}

module.exports = {
  ensureImagesTable,
  getImagesByCategory,
  getAllImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
};
