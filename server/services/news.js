const db = require("../config/db");

let setupPromise;

async function ensureNewsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS news (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          excerpt TEXT DEFAULT '',
          content TEXT DEFAULT '',
          image_url TEXT DEFAULT '',
          category TEXT DEFAULT 'General',
          tags TEXT[] DEFAULT '{}',
          is_published BOOLEAN NOT NULL DEFAULT false,
          published_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_news_published
        ON news(is_published, published_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_news_slug
        ON news(slug)
      `);
    })();
  }
  return setupPromise;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "post";
}

// ─── Public ───────────────────────────────────────────

async function getPublishedNews() {
  await ensureNewsTable();
  const result = await db.query(
    `SELECT id, title, slug, excerpt, image_url, category, tags, published_at
     FROM news
     WHERE is_published = true AND published_at <= NOW()
     ORDER BY published_at DESC
     LIMIT 20`
  );
  return result.rows;
}

async function getNewsBySlug(slug) {
  await ensureNewsTable();
  const result = await db.query(
    `SELECT * FROM news WHERE slug = $1 AND is_published = true AND published_at <= NOW()`,
    [slug]
  );
  return result.rows[0] || null;
}

// ─── Admin CRUD ───────────────────────────────────────

async function getAllNews() {
  await ensureNewsTable();
  const result = await db.query(
    "SELECT * FROM news ORDER BY created_at DESC"
  );
  return result.rows;
}

async function getNewsById(id) {
  await ensureNewsTable();
  const result = await db.query("SELECT * FROM news WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createNews({ title, excerpt, content, imageUrl, category, tags, isPublished, publishedAt }) {
  await ensureNewsTable();
  const slug = slugify(title);

  // Handle duplicate slugs
  let finalSlug = slug;
  let counter = 1;
  while (true) {
    const existing = await db.query("SELECT id FROM news WHERE slug = $1", [finalSlug]);
    if (existing.rows.length === 0) break;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const result = await db.query(
    `INSERT INTO news (title, slug, excerpt, content, image_url, category, tags, is_published, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      title,
      finalSlug,
      excerpt || "",
      content || "",
      imageUrl || "",
      category || "General",
      tags || [],
      isPublished !== false,
      publishedAt || (isPublished !== false ? new Date().toISOString() : null),
    ]
  );
  return result.rows[0];
}

async function updateNews(id, fields) {
  await ensureNewsTable();
  const sets = [];
  const params = [];
  let idx = 1;

  const fieldMap = {
    title: "title",
    excerpt: "excerpt",
    content: "content",
    imageUrl: "image_url",
    category: "category",
    tags: "tags",
    isPublished: "is_published",
    publishedAt: "published_at",
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
  sets.push("updated_at = NOW()");
  params.push(id);

  const result = await db.query(
    `UPDATE news SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteNews(id) {
  await ensureNewsTable();
  await db.query("DELETE FROM news WHERE id = $1", [id]);
  return { success: true };
}

module.exports = {
  ensureNewsTable,
  getPublishedNews,
  getNewsBySlug,
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
