const db = require("../config/db");

let setupPromise;

async function ensureAuditLogTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
          user_name TEXT,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          details JSONB,
          ip_address TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);
    })();
  }
  return setupPromise;
}

async function audit(user, action, entity, entityId = null, details = null, ip = null) {
  try {
    await ensureAuditLogTable();
    await db.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user?.id ?? null, user?.name ?? null, action, entity, entityId ? String(entityId) : null,
       details ? JSON.stringify(details) : null, ip ?? null]
    );
  } catch (error) {
    console.error("[Audit] Failed to log:", error.message);
  }
}

async function getAuditLogs({ entity, userId, limit = 50, offset = 0 } = {}) {
  await ensureAuditLogTable();
  let query = "SELECT * FROM audit_logs WHERE 1=1";
  const params = [];
  let pi = 1;
  if (entity) { query += ` AND entity = $${pi}`; params.push(entity); pi++; }
  if (userId) { query += ` AND user_id = $${pi}`; params.push(userId); pi++; }
  query += ` ORDER BY created_at DESC LIMIT $${pi} OFFSET $${pi + 1}`;
  params.push(limit, offset);
  const result = await db.query(query, params);
  return result.rows;
}

async function countAuditLogs({ entity, userId } = {}) {
  await ensureAuditLogTable();
  let query = "SELECT COUNT(*)::int AS count FROM audit_logs WHERE 1=1";
  const params = [];
  let pi = 1;
  if (entity) { query += ` AND entity = $${pi}`; params.push(entity); pi++; }
  if (userId) { query += ` AND user_id = $${pi}`; params.push(userId); pi++; }
  const result = await db.query(query, params);
  return result.rows[0].count;
}

module.exports = { ensureAuditLogTable, audit, getAuditLogs, countAuditLogs };
