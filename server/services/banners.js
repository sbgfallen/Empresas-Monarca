const db = require("../config/db");

let setupPromise;

async function ensureBannersTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS banners (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          image_url TEXT NOT NULL DEFAULT '',
          link_url TEXT DEFAULT '',
          link_label TEXT DEFAULT 'Saber más',
          position TEXT NOT NULL DEFAULT 'home_hero'
            CHECK (position IN ('home_hero', 'home_mid', 'home_bottom', 'sidebar', 'popup')),
          is_active BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_banners_active
        ON banners(is_active, sort_order)
      `);
    })();
  }
  return setupPromise;
}

// ─── Public ───────────────────────────────────────────

async function getActiveBanners() {
  await ensureBannersTable();
  const result = await db.query(
    `SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC, created_at DESC`
  );
  return result.rows;
}

async function getBannersByPosition(position) {
  await ensureBannersTable();
  const result = await db.query(
    `SELECT * FROM banners WHERE is_active = true AND position = $1 ORDER BY sort_order ASC, created_at DESC`,
    [position]
  );
  return result.rows;
}

// ─── Admin CRUD ───────────────────────────────────────

async function getAllBanners() {
  await ensureBannersTable();
  const result = await db.query("SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC");
  return result.rows;
}

async function getBannerById(id) {
  await ensureBannersTable();
  const result = await db.query("SELECT * FROM banners WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createBanner({ title, imageUrl, linkUrl, linkLabel, position, isActive, sortOrder }) {
  await ensureBannersTable();
  const result = await db.query(
    `INSERT INTO banners (title, image_url, link_url, link_label, position, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      title,
      imageUrl || "",
      linkUrl || "",
      linkLabel || "Saber más",
      position || "home_hero",
      isActive !== false,
      sortOrder || 0,
    ]
  );
  return result.rows[0];
}

async function updateBanner(id, fields) {
  await ensureBannersTable();
  const sets = [];
  const params = [];
  let idx = 1;

  const fieldMap = {
    title: "title",
    imageUrl: "image_url",
    linkUrl: "link_url",
    linkLabel: "link_label",
    position: "position",
    isActive: "is_active",
    sortOrder: "sort_order",
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
    `UPDATE banners SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteBanner(id) {
  await ensureBannersTable();
  await db.query("DELETE FROM banners WHERE id = $1", [id]);
  return { success: true };
}

module.exports = {
  ensureBannersTable,
  getActiveBanners,
  getBannersByPosition,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
