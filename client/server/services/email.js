const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    const fromName = process.env.SMTP_FROM_NAME || "Empresas Monarca";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@empresasmonarca.com.ar";

    console.log(`[Email] SMTP config: host="${host}" port=${port} user="${user}" fromEmail="${fromEmail}"`);

    // If no SMTP config is set, use a JSON transport that logs instead
    if (!host) {
      console.log("[Email] ⚠️ No SMTP_HOST configured. Emails will be logged but NOT sent.");
      const jsonTransport = require("nodemailer").createTransport({
        jsonTransport: true,
      });

      transporter = jsonTransport;
      return transporter;
    }

    console.log(`[Email] ✅ SMTP configured. Creating transporter to ${host}:${port}...`);

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection on startup
    transporter.verify((err) => {
      if (err) {
        console.log(`[Email] ❌ SMTP connection failed: ${err.message}`);
      } else {
        console.log(`[Email] ✅ SMTP connection verified successfully!`);
      }
    });
  }

  return transporter;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function generatePaymentSchedule(termMonths, installmentAmount, paymentPlan) {
  const schedule = [];
  const now = new Date();

  for (let i = 0; i < termMonths; i++) {
    const dueDate = new Date(now);
    if (paymentPlan === "daily") {
      dueDate.setDate(now.getDate() + i + 1);
    } else if (paymentPlan === "weekly") {
      dueDate.setDate(now.getDate() + (i + 1) * 7);
    } else {
      dueDate.setDate(now.getDate() + 30);
    }
    schedule.push({
      number: i + 1,
      date: dueDate.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      }),
      amount: installmentAmount,
    });
  }

  return schedule;
}

async function sendCreditApprovedEmail({ to, name, amount, termMonths, interestRate, monthlyPayment, totalPayment, paymentPlan = "monthly", whatsappNumber = "5491130000000" }) {
  const transport = getTransporter();
  const schedule = generatePaymentSchedule(termMonths, monthlyPayment, paymentPlan);

  const planLabels = {
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
  };

  // Show first 5, then summarize the rest if there are more
  const maxVisible = 5;
  const showAll = schedule.length <= maxVisible;
  const visibleRows = showAll ? schedule : schedule.slice(0, maxVisible);
  const remaining = schedule.length - maxVisible;

  const scheduleRows = visibleRows.map((p, i) => {
    const isLast = showAll ? i === schedule.length - 1 : i === maxVisible - 1;
    const borderStyle = isLast ? "" : "border-bottom: 1px solid rgba(251,113,133,0.10);";
    return `
      <tr style="${borderStyle}">
        <td style="padding: 8px 8px; color: rgba(254,252,245,0.4); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; width: 32px;">#${p.number}</td>
        <td style="padding: 8px 8px; color: #fefcf5; font-size: 12px; font-weight: 500; white-space: nowrap;">${p.date}</td>
        <td style="padding: 8px 8px; text-align: right; color: #fbbf24; font-size: 14px; font-weight: 800; white-space: nowrap; width: 120px;">${formatCurrency(p.amount)}</td>
      </tr>
    `;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      background: #1a0f0a;
      color: #fefcf5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Outer wrapper with brand-inspired background ── */
    .outer-wrapper {
      background:
        radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.14) 0%, transparent 55%),
        radial-gradient(ellipse at 18% 55%, rgba(251,113,133,0.18) 0%, transparent 50%),
        radial-gradient(ellipse at 82% 40%, rgba(245,158,11,0.12) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 100%, rgba(244,63,94,0.08) 0%, transparent 50%),
        linear-gradient(180deg, #1a0f0a 0%, #2d1a10 28%, #1a0f0a 65%, #0d0805 100%);
      padding: 40px 16px;
    }

    .container {
      max-width: 560px;
      margin: 0 auto;
    }

    /* ── Decorative top accent line ── */
    .top-accent {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #fb7185, #f59e0b, #fb7185);
      border-radius: 2px;
      margin: 0 auto 28px auto;
    }

    /* ── Header with logo ── */
    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-container {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px auto;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(251,113,133,0.15), rgba(245,158,11,0.10));
      border: 1px solid rgba(251,113,133,0.20);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .brand-name .accent-m {
      color: #fefcf5;
      text-shadow: 0 0 30px rgba(251, 113, 133, 0.30), 0 0 60px rgba(245, 158, 11, 0.15);
    }

    .brand-name .rest {
      color: #fefcf5;
    }

    /* ── Main card ── */
    .card {
      background: linear-gradient(135deg, rgba(251,113,133,0.04), rgba(245,158,11,0.02));
      border: 1px solid rgba(251,113,133,0.12);
      border-radius: 20px;
      padding: 32px 28px;
      margin-bottom: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Subtle glow in top-right */
    .card::before {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 160px;
      height: 160px;
      background: radial-gradient(circle, rgba(251,113,133,0.08), transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    /* ── Approval badge ── */
    .badge-wrapper {
      text-align: center;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.06));
      border: 1px solid rgba(52,211,153,0.20);
      color: #34d399;
      padding: 8px 20px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.10em;
    }

    /* ── Greeting ── */
    .greeting {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 8px 0;
      color: #fefcf5;
    }

    .greeting-sub {
      text-align: center;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(254,252,245,0.55);
      margin: 0 0 24px 0;
    }

    /* ── Loan summary grid ── */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .summary-item {
      background: rgba(254,252,245,0.03);
      border: 1px solid rgba(251,113,133,0.08);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
    }

    .summary-item.full-width {
      grid-column: 1 / -1;
    }

    .summary-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: rgba(254,252,245,0.35);
      margin: 0 0 6px 0;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 900;
      margin: 0;
      color: #fefcf5;
      letter-spacing: -0.01em;
    }

    .summary-value.rose {
      color: #fb7185;
    }

    .summary-value.amber {
      color: #fbbf24;
    }

    .summary-value.green {
      color: #34d399;
    }

    .summary-unit {
      font-size: 11px;
      color: rgba(254,252,245,0.35);
      font-weight: 500;
      margin: 2px 0 0 0;
    }

    /* ── Plan type label ── */
    .plan-type {
      display: inline-block;
      background: linear-gradient(135deg, rgba(251,113,133,0.10), rgba(245,158,11,0.06));
      border: 1px solid rgba(251,113,133,0.12);
      color: #fbbf24;
      padding: 4px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ── Schedule section ── */
    .schedule-section {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid rgba(251,113,133,0.10);
    }

    .schedule-title {
      font-size: 13px;
      font-weight: 700;
      color: rgba(254,252,245,0.6);
      margin: 0 0 12px 0;
      letter-spacing: 0.02em;
    }

    .schedule-table {
      width: 100%;
      border-collapse: collapse;
    }

    .schedule-table thead th {
      padding: 8px 12px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(254,252,245,0.30);
      text-align: left;
    }

    .schedule-table thead th:last-child {
      text-align: right;
    }

    .schedule-table tbody tr {
      transition: background 0.2s;
    }

    .schedule-table tbody tr:hover {
      background: rgba(251,113,133,0.04);
    }

    .see-more {
      text-align: center;
      padding: 12px 0 0 0;
      font-size: 11px;
      color: rgba(254,252,245,0.30);
      font-weight: 500;
    }

    /* ── Total row ── */
    .total-row {
      margin-top: 20px;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(251,113,133,0.06), rgba(245,158,11,0.03));
      border: 1px solid rgba(251,113,133,0.12);
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(254,252,245,0.40);
    }

    .total-amount {
      font-size: 24px;
      font-weight: 900;
      color: #fb923c;
      text-shadow: 0 0 30px rgba(251, 146, 60, 0.25);
    }

    /* ── Thank you section ── */
    .thanks-section {
      text-align: center;
      padding: 28px 24px;
      background: linear-gradient(135deg, rgba(251,113,133,0.03), rgba(245,158,11,0.02));
      border: 1px solid rgba(251,113,133,0.08);
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .thanks-icon {
      font-size: 36px;
      margin-bottom: 12px;
      display: block;
    }

    .thanks-title {
      font-size: 18px;
      font-weight: 800;
      color: #fefcf5;
      margin: 0 0 8px 0;
    }

    .thanks-text {
      font-size: 14px;
      line-height: 1.7;
      color: rgba(254,252,245,0.55);
      margin: 0;
    }

    .thanks-text strong {
      color: #fbbf24;
      font-weight: 700;
    }

    /* ── Contact card ── */
    .contact-card {
      background: rgba(254,252,245,0.02);
      border: 1px solid rgba(254,252,245,0.06);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }

    .contact-title {
      font-size: 12px;
      font-weight: 700;
      color: rgba(254,252,245,0.40);
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.10em;
    }

    .contact-text {
      font-size: 13px;
      color: rgba(254,252,245,0.50);
      line-height: 1.5;
      margin: 0;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding: 24px 0 0 0;
    }

    .footer-divider {
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, rgba(251,113,133,0.20), rgba(245,158,11,0.20));
      border-radius: 1px;
      margin: 0 auto 16px auto;
    }

    .footer-brand {
      font-size: 14px;
      font-weight: 700;
      color: rgba(254,252,245,0.25);
      margin: 0 0 4px 0;
      letter-spacing: 0.05em;
    }

    .footer-text {
      font-size: 11px;
      color: rgba(254,252,245,0.15);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Responsive ── */
    /* ── WhatsApp contact info ── */
    .wa-number {
      display: inline-block;
      font-size: 16px;
      font-weight: 800;
      color: #25D366;
      text-decoration: none;
      margin-top: 8px;
    }

    .wa-number:hover {
      color: #22c55e;
      text-decoration: underline;
    }

    @media only screen and (max-width: 480px) {
      .outer-wrapper { padding: 24px 12px; }
      .card { padding: 24px 16px; }
      .summary-grid { gap: 8px; }
      .summary-item { padding: 10px 6px; }
      .summary-value { font-size: 18px; }
      .total-amount { font-size: 18px; }
      .thanks-section { padding: 24px 16px; }
      .schedule-table tbody td { padding: 6px 6px !important; font-size: 11px !important; }
    }
  </style>
</head>
<body>
  <div class="outer-wrapper">
    <div class="container">

      <!-- ── Top accent line ── -->
      <div class="top-accent"></div>

      <!-- ── Header ── -->
      <div class="header">
        <div class="logo-container">
          <img src="cid:logo" alt="Empresas Monarca" width="72" height="72" />
        </div>
        <h1 class="brand-name">
          <span class="accent-m">Empresas</span> <span class="rest">Monarca</span>
        </h1>
      </div>

      <!-- ── Main Card ── -->
      <div class="card">

        <!-- Approval Badge -->
        <div class="badge-wrapper">
          <span class="badge">✦  Crédito aprobado</span>
        </div>

        <!-- Greeting -->
        <p class="greeting">¡Felicidades, ${name}! 🎉</p>
        <p class="greeting-sub">
          Tu solicitud de crédito ha sido <strong style="color:#34d399">aprobada</strong>.
          A continuación encontrarás todos los detalles de tu plan de pago.
        </p>

        <!-- Summary Grid -->
        <div class="summary-grid">
          <div class="summary-item">
            <p class="summary-label">Monto solicitado</p>
            <p class="summary-value">${formatCurrency(amount)}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Valor de cuota</p>
            <p class="summary-value amber">${formatCurrency(monthlyPayment)}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Cantidad de cuotas</p>
            <p class="summary-value rose">${termMonths}</p>
            <p class="summary-unit">${planLabels[paymentPlan] || "Mensual"}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Tasa de interés</p>
            <p class="summary-value">${interestRate}%</p>
          </div>
        </div>

        <!-- Payment Schedule -->
        <div class="schedule-section">
          <p class="schedule-title">📅  Calendario de pagos</p>
          <table class="schedule-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha de vencimiento</th>
                <th style="text-align:right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows}
            </tbody>
          </table>
          ${!showAll ? `<p class="see-more">+ ${remaining} cuotas más — Total: ${schedule.length} cuotas de ${formatCurrency(totalPayment / schedule.length)} c/u</p>` : ""}
        </div>

        <!-- Total -->
        <div class="total-row" style="margin-top: 24px;">
          <span class="total-label">Total a pagar</span>
          <span class="total-amount">${formatCurrency(totalPayment)}</span>
        </div>

      </div>

      <!-- ── Thanks Section ── -->
      <div class="thanks-section">
        <span class="thanks-icon">🙏</span>
        <p class="thanks-title">Gracias por confiar en nosotros</p>
        <p class="thanks-text">
          En <strong>Empresas Monarca</strong> estamos comprometidos con tu crecimiento.
          Este crédito es el primer paso para alcanzar tus metas. 
          ¡Estamos seguros de que será el inicio de una gran relación!
        </p>
      </div>

      <!-- ── Contact ── -->
      <div class="contact-card">
        <p class="contact-title">📞  ¿Tenés dudas?</p>
        <p class="contact-text">
          Un asesor se pondrá en contacto contigo para coordinar los siguientes pasos.
          Si necesitas ayuda inmediata, escribinos por WhatsApp:
        </p>
        <a href="https://wa.me/${whatsappNumber}" target="_blank" class="wa-number">
          📱  ${whatsappNumber}
        </a>
      </div>

      <!-- ── Footer ── -->
      <div class="footer">
        <div class="footer-divider"></div>
        <p class="footer-brand">✦ Empresas Monarca ✦</p>
        <p class="footer-text">Argentina — Calidad y compromiso</p>
        <p class="footer-text" style="margin-top: 4px;">
          Este es un mensaje automático. Por favor no respondas a este correo.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  try {
    const logoPath = path.join(__dirname, "..", "..", "client", "public", "logo.jpg");

    const attachments = [];

    // Attach logo if it exists
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: "logo.jpg",
        path: logoPath,
        cid: "logo",
      });
      console.log(`[Email] ✅ Logo attached from ${logoPath}`);
    } else {
      console.log(`[Email] ⚠️ Logo not found at ${logoPath}, sending without logo`);
    }

    const info = await transport.sendMail({
      from: `"Empresas Monarca" <${process.env.SMTP_FROM_EMAIL || "no-reply@empresasmonarca.com.ar"}>`,
      to,
      subject: `✅ ¡${name}, tu crédito fue aprobado! — Empresas Monarca`,
      html,
      attachments,
    });

    console.log(`📧 Credit approval email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to send email to ${to}: ${error.message}`);
    if (error.response) {
      console.log(`   SMTP response: ${error.response}`);
    }
    return false;
  }
}

module.exports = {
  sendCreditApprovedEmail,
};
