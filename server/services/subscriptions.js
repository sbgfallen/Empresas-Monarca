const db = require("../config/db");
const nodemailer = require("nodemailer");

let setupPromise;

async function ensureSubscriptionsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_email
        ON subscriptions(email)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_active
        ON subscriptions(is_active)
      `);
    })();
  }
  return setupPromise;
}

// ─── Subscribe ────────────────────────────────────────

async function subscribe(email) {
  await ensureSubscriptionsTable();

  const normalized = email.trim().toLowerCase();

  // Check if already exists
  const existing = await db.query(
    "SELECT * FROM subscriptions WHERE email = $1",
    [normalized]
  );

  if (existing.rows.length > 0) {
    // If inactive, reactivate
    if (!existing.rows[0].is_active) {
      const result = await db.query(
        "UPDATE subscriptions SET is_active = true, updated_at = NOW() WHERE email = $1 RETURNING *",
        [normalized]
      );
      return { subscriber: result.rows[0], wasReactivation: true };
    }
    return { subscriber: existing.rows[0], alreadyExists: true };
  }

  const result = await db.query(
    "INSERT INTO subscriptions (email) VALUES ($1) RETURNING *",
    [normalized]
  );

  return { subscriber: result.rows[0], wasReactivation: false };
}

async function unsubscribe(email) {
  await ensureSubscriptionsTable();

  const normalized = email.trim().toLowerCase();
  const result = await db.query(
    "UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE email = $1 RETURNING *",
    [normalized]
  );

  return { subscriber: result.rows[0] || null };
}

// ─── Get subscribers ──────────────────────────────────

async function getActiveSubscribers() {
  await ensureSubscriptionsTable();
  const result = await db.query(
    "SELECT * FROM subscriptions WHERE is_active = true ORDER BY created_at DESC"
  );
  return result.rows;
}

async function getAllSubscribers() {
  await ensureSubscriptionsTable();
  const result = await db.query(
    "SELECT * FROM subscriptions ORDER BY created_at DESC"
  );
  return result.rows;
}

async function getSubscriberCount() {
  await ensureSubscriptionsTable();
  const result = await db.query(
    "SELECT COUNT(*) as count FROM subscriptions WHERE is_active = true"
  );
  return parseInt(result.rows[0].count, 10);
}

// ─── Send notification email to all subscribers ───────

function getTransporter() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host) {
    const jsonTransport = nodemailer.createTransport({
      jsonTransport: true,
    });
    return jsonTransport;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

async function sendNewProductNotification(productUrl) {
  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    console.log("[Subscriptions] No active subscribers to notify.");
    return;
  }

  const transport = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      background: #1a0f0a;
      color: #fefcf5;
      -webkit-font-smoothing: antialiased;
    }
    .outer-wrapper {
      background: radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.14) 0%, transparent 55%),
                  radial-gradient(ellipse at 18% 55%, rgba(251,113,133,0.18) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 100%, rgba(244,63,94,0.08) 0%, transparent 50%),
                  linear-gradient(180deg, #1a0f0a 0%, #2d1a10 28%, #1a0f0a 65%, #0d0805 100%);
      padding: 40px 16px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .top-accent {
      width: 80px; height: 4px;
      background: linear-gradient(90deg, #fb7185, #f59e0b, #fb7185);
      border-radius: 2px; margin: 0 auto 28px auto;
    }
    .header { text-align: center; margin-bottom: 32px; }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; margin: 0; color: #fefcf5; }
    .card {
      background: linear-gradient(135deg, rgba(251,113,133,0.04), rgba(245,158,11,0.02));
      border: 1px solid rgba(251,113,133,0.12);
      border-radius: 20px; padding: 32px 28px; margin-bottom: 20px;
      position: relative; overflow: hidden;
    }
    .card::before {
      content: ''; position: absolute; top: -60px; right: -60px;
      width: 160px; height: 160px;
      background: radial-gradient(circle, rgba(251,113,133,0.08), transparent 70%);
      border-radius: 50%; pointer-events: none;
    }
    .greeting { text-align: center; font-size: 18px; font-weight: 800; margin: 0 0 16px 0; color: #fefcf5; }
    .greeting-sub {
      text-align: center; font-size: 14px; line-height: 1.6;
      color: rgba(254,252,245,0.55); margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff; text-decoration: none;
      padding: 14px 32px; border-radius: 12px;
      font-size: 15px; font-weight: 800;
      letter-spacing: 0.02em;
      box-shadow: 0 8px 30px rgba(244,63,94,0.25);
    }
    .btn:hover { background: linear-gradient(135deg, #e11d48, #be123c); }
    .footer-text {
      text-align: center; font-size: 11px;
      color: rgba(254,252,245,0.15); margin-top: 24px; line-height: 1.5;
    }
    .unsubscribe {
      text-align: center; font-size: 10px;
      color: rgba(254,252,245,0.10); margin-top: 12px;
    }
    @media only screen and (max-width: 480px) {
      .outer-wrapper { padding: 24px 12px; }
      .card { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="outer-wrapper">
    <div class="container">
      <div class="top-accent"></div>
      <div class="header">
        <h1 class="brand-name">✦ Empresas Monarca</h1>
      </div>
      <div class="card">
        <p class="greeting">🆕 ¡Nuevo producto disponible!</p>
        <p class="greeting-sub">
          Hemos agregado un nuevo producto a nuestro catálogo. ¡No te lo pierdas!
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${productUrl}" class="btn" target="_blank">Ver producto</a>
        </div>
      </div>
      <p class="footer-text">✦ Empresas Monarca — Argentina</p>
      <p class="unsubscribe">
        Si no deseas recibir más notificaciones, responde a este correo.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  let successCount = 0;
  let failCount = 0;

  for (const sub of subscribers) {
    try {
      const info = await transport.sendMail({
        from: `"Empresas Monarca" <${process.env.SMTP_FROM_EMAIL || "no-reply@empresasmonarca.com.ar"}>`,
        to: sub.email,
        subject: "🆕 ¡Nuevo producto disponible! — Empresas Monarca",
        html,
      });
      console.log(`[Subscriptions] Email sent to ${sub.email}: ${info.messageId}`);
      successCount++;
    } catch (error) {
      console.log(`[Subscriptions] Failed to send to ${sub.email}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`[Subscriptions] Notified ${successCount} subscribers (${failCount} failures)`);
  return { successCount, failCount };
}

async function sendNewPromotionNotification(promotionTitle, promotionUrl) {
  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    console.log("[Subscriptions] No active subscribers to notify.");
    return;
  }

  const transport = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      background: #1a0f0a;
      color: #fefcf5;
      -webkit-font-smoothing: antialiased;
    }
    .outer-wrapper {
      background: radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.14) 0%, transparent 55%),
                  radial-gradient(ellipse at 18% 55%, rgba(251,113,133,0.18) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 100%, rgba(244,63,94,0.08) 0%, transparent 50%),
                  linear-gradient(180deg, #1a0f0a 0%, #2d1a10 28%, #1a0f0a 65%, #0d0805 100%);
      padding: 40px 16px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .top-accent {
      width: 80px; height: 4px;
      background: linear-gradient(90deg, #fb7185, #f59e0b, #fb7185);
      border-radius: 2px; margin: 0 auto 28px auto;
    }
    .header { text-align: center; margin-bottom: 32px; }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; margin: 0; color: #fefcf5; }
    .card {
      background: linear-gradient(135deg, rgba(251,113,133,0.04), rgba(245,158,11,0.02));
      border: 1px solid rgba(251,113,133,0.12);
      border-radius: 20px; padding: 32px 28px; margin-bottom: 20px;
      position: relative; overflow: hidden;
    }
    .card::before {
      content: ''; position: absolute; top: -60px; right: -60px;
      width: 160px; height: 160px;
      background: radial-gradient(circle, rgba(251,113,133,0.08), transparent 70%);
      border-radius: 50%; pointer-events: none;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, rgba(244,63,94,0.12), rgba(251,146,60,0.06));
      border: 1px solid rgba(244,63,94,0.20);
      color: #fb7185; padding: 8px 20px; border-radius: 999px;
      font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.10em;
      margin-bottom: 16px;
    }
    .greeting { text-align: center; font-size: 22px; font-weight: 900; margin: 16px 0 8px 0; color: #fefcf5; }
    .greeting-sub {
      text-align: center; font-size: 14px; line-height: 1.6;
      color: rgba(254,252,245,0.55); margin: 0 0 24px 0;
    }
    .promo-title {
      text-align: center; font-size: 28px; font-weight: 900;
      background: linear-gradient(135deg, #fb7185, #fbbf24);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff; text-decoration: none;
      padding: 14px 32px; border-radius: 12px;
      font-size: 15px; font-weight: 800;
      box-shadow: 0 8px 30px rgba(244,63,94,0.25);
    }
    .footer-text {
      text-align: center; font-size: 11px;
      color: rgba(254,252,245,0.15); margin-top: 24px; line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .outer-wrapper { padding: 24px 12px; }
      .card { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="outer-wrapper">
    <div class="container">
      <div class="top-accent"></div>
      <div class="header">
        <h1 class="brand-name">✦ Empresas Monarca</h1>
      </div>
      <div class="card">
        <div style="text-align: center;">
          <span class="badge">🔥 Nueva promoción</span>
        </div>
        <p class="greeting">¡No te pierdas esta oferta!</p>
        <p class="promo-title">${promotionTitle}</p>
        <p class="greeting-sub">
          Aprovecha esta promoción especial por tiempo limitado.
          Hacé clic en el botón para ver más detalles.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${promotionUrl}" class="btn" target="_blank">Ver promoción</a>
        </div>
      </div>
      <p class="footer-text">✦ Empresas Monarca — Argentina</p>
    </div>
  </div>
</body>
</html>
  `;

  let successCount = 0;
  let failCount = 0;

  for (const sub of subscribers) {
    try {
      const info = await transport.sendMail({
        from: `"Empresas Monarca" <${process.env.SMTP_FROM_EMAIL || "no-reply@empresasmonarca.com.ar"}>`,
        to: sub.email,
        subject: `🔥 ${promotionTitle} — Empresas Monarca`,
        html,
      });
      console.log(`[Subscriptions] Promo email sent to ${sub.email}: ${info.messageId}`);
      successCount++;
    } catch (error) {
      console.log(`[Subscriptions] Failed to send promo to ${sub.email}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`[Subscriptions] Notified ${successCount} subscribers about promotion (${failCount} failures)`);
  return { successCount, failCount };
}

module.exports = {
  ensureSubscriptionsTable,
  subscribe,
  unsubscribe,
  getActiveSubscribers,
  getAllSubscribers,
  getSubscriberCount,
  sendNewProductNotification,
  sendNewPromotionNotification,
};
