const db = require("../config/db");

let setupPromise;

async function ensureReservationsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY, date DATE NOT NULL, time TEXT NOT NULL,
          people INTEGER NOT NULL DEFAULT 1, name TEXT NOT NULL, phone TEXT NOT NULL,
          comment TEXT, status TEXT NOT NULL DEFAULT 'PENDIENTE', customer_id INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
      )`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)`);
    })();
  }
  return setupPromise;
}

async function createReservation(input) {
  await ensureReservationsTable();
  const result = await db.query(
    `INSERT INTO reservations (date, time, people, name, phone, comment)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.date, input.time, input.people, input.name, input.phone, input.comment || null]
  );
  return result.rows[0];
}

async function getReservations({ status, date, limit = 50, offset = 0 } = {}) {
  await ensureReservationsTable();
  let query = "SELECT * FROM reservations WHERE deleted_at IS NULL";
  const params = []; let pi = 1;
  if (status) { query += ` AND status = $${pi}`; params.push(status); pi++; }
  if (date) { query += ` AND date = $${pi}`; params.push(date); pi++; }
  query += ` ORDER BY date ASC, time ASC LIMIT $${pi} OFFSET $${pi + 1}`;
  params.push(limit, offset);
  const result = await db.query(query, params);
  return result.rows;
}

async function getReservationById(id) {
  await ensureReservationsTable();
  const result = await db.query("SELECT * FROM reservations WHERE id = $1 AND deleted_at IS NULL", [id]);
  return result.rows[0] || null;
}

async function updateReservationStatus(id, status) {
  await ensureReservationsTable();
  const result = await db.query(`UPDATE reservations SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`, [status, id]);
  return result.rows[0] || null;
}

async function deleteReservation(id) {
  await ensureReservationsTable();
  await db.query("UPDATE reservations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
}

async function getReservationStats() {
  await ensureReservationsTable();
  const result = await db.query(`
    SELECT COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 'PENDIENTE' THEN 1 ELSE 0 END), 0)::int AS pending,
      COALESCE(SUM(CASE WHEN status = 'CONFIRMADA' THEN 1 ELSE 0 END), 0)::int AS confirmed,
      COALESCE(SUM(CASE WHEN status = 'COMPLETADA' THEN 1 ELSE 0 END), 0)::int AS completed,
      COALESCE(SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END), 0)::int AS cancelled
    FROM reservations WHERE deleted_at IS NULL
  `);
  return result.rows[0];
}

module.exports = { ensureReservationsTable, createReservation, getReservations, getReservationById, updateReservationStatus, deleteReservation, getReservationStats };
