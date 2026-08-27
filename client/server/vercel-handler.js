/**
 * Vercel Serverless Handler for Express
 * This file is used by the Next.js App Router route handler
 * to bridge requests to the Express app.
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// ─── Import routes ─────────────────────────────────────
const authRoutes = require("./routes/auth");
const adminUserRoutes = require("./routes/adminUsers");
const productRoutes = require("./routes/products");
const creditRoutes = require("./routes/credits");
const analyticsRoutes = require("./routes/analytics");
const settingsRoutes = require("./routes/settings");
const promotionsRoutes = require("./routes/promotions");
const newsRoutes = require("./routes/news");
const bannersRoutes = require("./routes/banners");
const announcementsRoutes = require("./routes/announcements");
const imagesRoutes = require("./routes/images");
const cobrosRoutes = require("./routes/cobros");
const categoriesRoutes = require("./routes/categories");
const subscriptionsRoutes = require("./routes/subscriptions");
const ordersRoutes = require("./routes/orders");
const reservationsRoutes = require("./routes/reservations");
const auditRoutes = require("./routes/audit");
const sectionsRoutes = require("./routes/sections");
const debugRoutes = require("./routes/debug");

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
    const { initializeDatabase } = require("./init");
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
