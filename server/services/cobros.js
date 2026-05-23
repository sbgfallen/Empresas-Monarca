const db = require("../config/db");

let setupPromise;

async function ensureCobrosTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      // Main cobros table (loans + quotes)
      await db.query(`
        CREATE TABLE IF NOT EXISTS cobros (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('loan', 'quote')),
          client_name TEXT NOT NULL,
          client_phone TEXT NOT NULL DEFAULT '',
          amount NUMERIC NOT NULL,
          description TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Payments table (abonos)
      await db.query(`
        CREATE TABLE IF NOT EXISTS cobro_payments (
          id SERIAL PRIMARY KEY,
          cobro_id INTEGER NOT NULL REFERENCES cobros(id) ON DELETE CASCADE,
          amount NUMERIC NOT NULL,
          payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          notes TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Index for faster lookups
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_cobro_payments_cobro_id
        ON cobro_payments(cobro_id)
      `);
    })();
  }

  return setupPromise;
}

// ─── Cobros ────────────────────────────────────────────

async function getAllCobros({ type, status } = {}) {
  await ensureCobrosTable();

  let query = "SELECT * FROM cobros WHERE 1=1";
  const params = [];

  if (type && ["loan", "quote"].includes(type)) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }

  if (status && ["active", "paid", "cancelled"].includes(status)) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

  const result = await db.query(query, params);
  const cobros = result.rows;

  // Attach payments to each cobro
  for (const cobro of cobros) {
    const payments = await db.query(
      "SELECT * FROM cobro_payments WHERE cobro_id = $1 ORDER BY payment_date ASC",
      [cobro.id]
    );
    cobro.payments = payments.rows;
  }

  return cobros;
}

async function getCobroById(id) {
  await ensureCobrosTable();

  const result = await db.query("SELECT * FROM cobros WHERE id = $1", [id]);

  if (!result.rows[0]) return null;

  const payments = await db.query(
    "SELECT * FROM cobro_payments WHERE cobro_id = $1 ORDER BY payment_date ASC",
    [id]
  );

  result.rows[0].payments = payments.rows;

  return result.rows[0];
}

async function createCobro({ type, clientName, clientPhone, amount, description }) {
  await ensureCobrosTable();

  const result = await db.query(
    `INSERT INTO cobros (type, client_name, client_phone, amount, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [type, clientName, clientPhone, amount, description || ""]
  );

  const cobro = result.rows[0];
  cobro.payments = [];

  return cobro;
}

async function updateCobroStatus(id, status) {
  await ensureCobrosTable();

  const validStatuses = new Set(["active", "paid", "cancelled"]);
  if (!validStatuses.has(status)) return null;

  const result = await db.query(
    `UPDATE cobros SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  return result.rows[0] || null;
}

async function deleteCobro(id) {
  await ensureCobrosTable();

  const result = await db.query(
    "DELETE FROM cobros WHERE id = $1 RETURNING id",
    [id]
  );

  return result.rows.length > 0;
}

// ─── Payments ──────────────────────────────────────────

async function addPayment({ cobroId, amount, paymentDate, notes }) {
  await ensureCobrosTable();

  const result = await db.query(
    `INSERT INTO cobro_payments (cobro_id, amount, payment_date, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cobroId, amount, paymentDate, notes || ""]
  );

  // Auto-update cobro status to 'paid' if fully paid
  const cobro = await db.query("SELECT * FROM cobros WHERE id = $1", [cobroId]);
  if (cobro.rows[0]) {
    const totalPaidResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM cobro_payments WHERE cobro_id = $1",
      [cobroId]
    );
    const totalPaid = Number(totalPaidResult.rows[0].total);
    const totalAmount = Number(cobro.rows[0].amount);

    if (totalPaid >= totalAmount) {
      await db.query(
        "UPDATE cobros SET status = 'paid', updated_at = NOW() WHERE id = $1",
        [cobroId]
      );
    }
  }

  return result.rows[0];
}

async function getPaymentsByCobroId(cobroId) {
  await ensureCobrosTable();

  const result = await db.query(
    "SELECT * FROM cobro_payments WHERE cobro_id = $1 ORDER BY payment_date ASC",
    [cobroId]
  );

  return result.rows;
}

// ─── Stats / Aggregates ────────────────────────────────

async function getCobroStats() {
  await ensureCobrosTable();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0)::int AS active,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0)::int AS paid,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled,
      COALESCE(SUM(amount), 0)::numeric AS total_amount,
      COALESCE(SUM(CASE WHEN type = 'loan' THEN amount ELSE 0 END), 0)::numeric AS total_loans,
      COALESCE(SUM(CASE WHEN type = 'quote' THEN amount ELSE 0 END), 0)::numeric AS total_quotes
    FROM cobros
  `);

  return result.rows[0];
}

module.exports = {
  ensureCobrosTable,
  getAllCobros,
  getCobroById,
  createCobro,
  updateCobroStatus,
  deleteCobro,
  addPayment,
  getPaymentsByCobroId,
  getCobroStats,
};
