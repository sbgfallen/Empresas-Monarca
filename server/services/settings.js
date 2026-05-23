const db = require("../config/db");

let setupPromise;

async function ensureSettingsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL
          )
        `);

        // Insert default settings if they don't exist
        await db.query(`
          INSERT INTO app_settings (key, value)
          VALUES ('whatsapp_number', '573000000000')
          ON CONFLICT (key) DO NOTHING
        `);
      } catch (error) {
        // Reset so next call retries initialization
        setupPromise = null;
        throw error;
      }
    })();
  }

  return setupPromise;
}

async function getSetting(key) {
  await ensureSettingsTable();

  const result = await db.query(
    "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
    [key]
  );

  return result.rows[0]?.value || null;
}

async function getAllSettings() {
  await ensureSettingsTable();

  const result = await db.query("SELECT key, value, updated_at, updated_by FROM app_settings ORDER BY key ASC");

  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }

  return settings;
}

async function updateSetting(key, value, adminId) {
  await ensureSettingsTable();

  await db.query(
    `
    INSERT INTO app_settings (key, value, updated_at, updated_by)
    VALUES ($1, $2, NOW(), $3)
    ON CONFLICT (key)
    DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3
    `,
    [key, value, adminId]
  );

  return { key, value };
}

module.exports = {
  ensureSettingsTable,
  getSetting,
  getAllSettings,
  updateSetting,
};
