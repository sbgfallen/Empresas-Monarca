const db = require("../config/db");

let setupPromise;

const VALID_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "paid",
]);

async function ensureCreditsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS credits (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          term_months INTEGER NOT NULL,
          interest_rate NUMERIC NOT NULL DEFAULT 10,
          monthly_payment NUMERIC NOT NULL,
          total_payment NUMERIC NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Ensure total_payment column exists in existing tables
      try {
        await db.query(`
          ALTER TABLE credits
          ADD COLUMN IF NOT EXISTS total_payment NUMERIC NOT NULL DEFAULT 0
        `);
      } catch {
        // Column may already exist or table not yet created
      }
    })();
  }

  return setupPromise;
}

function validateStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  return VALID_STATUSES.has(normalized) ? normalized : null;
}

async function getAllCredits(statusFilter) {
  await ensureCreditsTable();

  let query = "SELECT * FROM credits";
  const params = [];

  if (statusFilter && VALID_STATUSES.has(statusFilter)) {
    query += " WHERE status = $1";
    params.push(statusFilter);
  }

  query += " ORDER BY created_at DESC";

  const result = await db.query(query, params);

  return result.rows;
}

async function getCreditById(id) {
  await ensureCreditsTable();

  const result = await db.query(
    "SELECT * FROM credits WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

async function createCredit({ name, email, phone, amount, termMonths, interestRate, monthlyPayment, totalPayment }) {
  await ensureCreditsTable();

  const result = await db.query(
    `
    INSERT INTO credits
      (name, email, phone, amount, term_months, interest_rate, monthly_payment, total_payment)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [name, email, phone, amount, termMonths, interestRate, monthlyPayment, totalPayment]
  );

  return result.rows[0];
}

async function updateCreditStatus(id, status, notes) {
  await ensureCreditsTable();

  const normalizedStatus = validateStatus(status);

  if (!normalizedStatus) {
    return null;
  }

  const result = await db.query(
    `
    UPDATE credits
    SET status = $1,
        notes = COALESCE($2, notes),
        updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [normalizedStatus, notes, id]
  );

  return result.rows[0] || null;
}

async function countByStatus() {
  await ensureCreditsTable();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0)::int AS approved,
      COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0)::int AS rejected,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0)::int AS paid
    FROM credits
  `);

  return result.rows[0];
}

module.exports = {
  ensureCreditsTable,
  getAllCredits,
  getCreditById,
  createCredit,
  updateCreditStatus,
  countByStatus,
  validateStatus,
};
