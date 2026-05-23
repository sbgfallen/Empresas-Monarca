const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const { initializeDatabase } = require("./init");

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

const app = express();
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim());

// Only serve uploads statically in development (no Cloudinary)
if (process.env.NODE_ENV !== "production" || !process.env.CLOUDINARY_CLOUD_NAME) {
  app.use(
    "/uploads",
    express.static(
      path.join(__dirname, "uploads")
    )
  );
}

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      const isLocalDev =
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (isLocalDev || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use(cookieParser());
// Serve uploads statically in development
if (process.env.NODE_ENV !== "production" || !process.env.CLOUDINARY_CLOUD_NAME) {
  app.use("/uploads", express.static("uploads"));
}



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

app.get("/", (req, res) => {

  res.json({
    message: "API RUNNING",
  });

});



const PORT = process.env.PORT || 5000;

// Initialize database tables before starting the server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER RUNNING ON ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to initialize database:", err.message);
    process.exit(1);
  });

app.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM admin_users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
