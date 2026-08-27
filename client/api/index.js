/**
 * Vercel Serverless Adapter for Express
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// ─── Import routes ─────────────────────────────────────
const authRoutes = require("../server/routes/auth");
const adminUserRoutes = require("../server/routes/adminUsers");
const productRoutes = require("../server/routes/products");
const creditRoutes = require("../server/routes/credits");
const analyticsRoutes = require("../server/routes/analytics");
const settingsRoutes = require("../server/routes/settings");
const promotionsRoutes = require("../server/routes/promotions");
const newsRoutes = require("../server/routes/news");
const bannersRoutes = require("../server/routes/banners");
const announcementsRoutes = require("../server/routes/announcements");
const imagesRoutes = require("../server/routes/images");
const cobrosRoutes = require("../server/routes/cobros");
const categoriesRoutes = require("../server/routes/categories");
const subscriptionsRoutes = require("../server/routes/subscriptions");
const ordersRoutes = require("../server/routes/orders");
const reservationsRoutes = require("../server/routes/reservations");
const auditRoutes = require("../server/routes/audit");
const sectionsRoutes = require("../server/routes/sections");
const debugRoutes = require("../server/routes/debug");

// ─── Initialize Express app ────────────────────────────
const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "https://empresas-monarca.vercel.app"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());
app.use(cookieParser());

// ─── Mount routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin-users", adminUserRoutes);
app.use("/api/products", productRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/cobros", cobrosRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/debug", debugRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "API RUNNING", timestamp: new Date().toISOString() });
});

// ─── Initialize database on cold start ─────────────────
let dbInitialized = false;

async function ensureDb() {
  if (dbInitialized) return;
  try {
    const { initializeDatabase } = require("../server/init");
    await initializeDatabase();
    dbInitialized = true;
    console.log("[Vercel] Database initialized successfully");
  } catch (err) {
    console.error("[Vercel] Database init error:", err.message);
  }
}

// ─── Export for Vercel ─────────────────────────────────
module.exports = async (req, res) => {
  await ensureDb();
  return app(req, res);
};
