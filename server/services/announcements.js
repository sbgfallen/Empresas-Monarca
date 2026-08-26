const db = require("../config/db");

let setupPromise;

async function ensureAnnouncementsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS announcements (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT DEFAULT '',
          type TEXT NOT NULL DEFAULT 'info'
            CHECK (type IN ('info', 'warning', 'success', 'promo', 'urgent')),
          link_url TEXT DEFAULT '',
          link_label TEXT DEFAULT 'Saber más',
          icon TEXT DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT true,
          starts_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_announcements_active
        ON announcements(is_active, sort_order)
      `);
    })();
  }
  return setupPromise;
}

// ─── Public ───────────────────────────────────────────

async function getActiveAnnouncements() {
  await ensureAnnouncementsTable();
  const result = await db.query(
    `SELECT * FROM announcements
     WHERE is_active = true
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY sort_order ASC, created_at DESC`
  );
  return result.rows;
}

// ─── Admin CRUD ───────────────────────────────────────

async function getAllAnnouncements() {
  await ensureAnnouncementsTable();
  const result = await db.query(
    "SELECT * FROM announcements ORDER BY sort_order ASC, created_at DESC"
  );
  return result.rows;
}

async function getAnnouncementById(id) {
  await ensureAnnouncementsTable();
  const result = await db.query("SELECT * FROM announcements WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createAnnouncement({ title, content, type, linkUrl, linkLabel, icon, isActive, startsAt, expiresAt, sortOrder }) {
  await ensureAnnouncementsTable();
  const result = await db.query(
    `INSERT INTO announcements (title, content, type, link_url, link_label, icon, is_active, starts_at, expires_at, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      title,
      content || "",
      type || "info",
      linkUrl || "",
      linkLabel || "Saber más",
      icon || "",
      isActive !== false,
      startsAt || null,
      expiresAt || null,
      sortOrder || 0,
    ]
  );
  return result.rows[0];
}

async function updateAnnouncement(id, fields) {
  await ensureAnnouncementsTable();
  const sets = [];
  const params = [];
  let idx = 1;

  const fieldMap = {
    title: "title",
    content: "content",
    type: "type",
    linkUrl: "link_url",
    linkLabel: "link_label",
    icon: "icon",
    isActive: "is_active",
    startsAt: "starts_at",
    expiresAt: "expires_at",
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
    `UPDATE announcements SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteAnnouncement(id) {
  await ensureAnnouncementsTable();
  await db.query("DELETE FROM announcements WHERE id = $1", [id]);
  return { success: true };
}

module.exports = {
  ensureAnnouncementsTable,
  getActiveAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
