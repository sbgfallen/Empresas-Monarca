/**
 * Vercel Serverless Adapter for Express
 *
 * This file wraps the Express app as a Vercel serverless function.
 * All /api/* routes are handled by this single function.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";

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

// ─── Initialize Express app ────────────────────────────
const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS — allow Vercel frontend
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "https://empresas-monarca.vercel.app"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, etc.)
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
  } catch (err: any) {
    console.error("[Vercel] Database init error:", err.message);
  }
}

// ─── Export for Vercel ─────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure database tables exist (runs once per cold start)
  await ensureDb();

  // Route through Express
  return app(req, res);
}
