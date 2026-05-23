const bcrypt = require("bcryptjs");

const db = require("../config/db");

const DEFAULT_ADMIN = {
  email: "marcox090919@gmail.com",
  name: "Marco",
  password: "020222Mm.",
  role: "owner",
};

let setupPromise;

function getBootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN.email;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN.password;

  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  ) {
    console.warn(
      "[Admin] Using default admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD env vars for security."
    );
  }

  return {
    email: email.trim().toLowerCase(),
    name: process.env.ADMIN_NAME || DEFAULT_ADMIN.name,
    password,
    role: process.env.ADMIN_ROLE || DEFAULT_ADMIN.role,
  };
}

async function ensureAdminUsers() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const admins = await db.query("SELECT COUNT(*)::int AS total FROM admin_users");

      if (admins.rows[0].total === 0) {
        const bootstrap = getBootstrapAdmin();
        const passwordHash = await bcrypt.hash(bootstrap.password, 12);

        await db.query(
          `
          INSERT INTO admin_users (name, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
          `,
          [bootstrap.name, bootstrap.email, passwordHash, bootstrap.role]
        );

        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
          console.warn(
            "Created development admin: admin@empresasmonarca.com / MonarcaAdmin2026!. Set ADMIN_EMAIL and ADMIN_PASSWORD before production."
          );
        }
      }
    })();
  }

  return setupPromise;
}

async function findAdminByEmail(email) {
  await ensureAdminUsers();

  const result = await db.query(
    `
    SELECT id, name, email, password_hash, role, active
    FROM admin_users
    WHERE email = $1
    LIMIT 1
    `,
    [email.trim().toLowerCase()]
  );

  return result.rows[0] || null;
}

async function findAdminById(id) {
  await ensureAdminUsers();

  const result = await db.query(
    `
    SELECT id, name, email, role, active
    FROM admin_users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findAdminCredentialsById(id) {
  await ensureAdminUsers();

  const result = await db.query(
    `
    SELECT id, name, email, password_hash, role, active
    FROM admin_users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

function toAdminDto(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

module.exports = {
  ensureAdminUsers,
  findAdminByEmail,
  findAdminCredentialsById,
  findAdminById,
  toAdminDto,
};
