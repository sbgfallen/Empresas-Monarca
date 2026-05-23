const db = require("./config/db");

const { ensureBannersTable } = require("./services/banners");
const { ensureAnnouncementsTable } = require("./services/announcements");
const { ensurePromotionsTables } = require("./services/promotions");
const { ensureNewsTable } = require("./services/news");
const { ensureImagesTable } = require("./services/images");
const { ensureSettingsTable } = require("./services/settings");
const { ensureAdminUsers } = require("./services/adminUsers");
const { ensureAnalyticsTables } = require("./services/analytics");
const { ensureCreditsTable } = require("./services/credits");
const { ensureCategoriesTable } = require("./services/categories");
const { ensureSubscriptionsTable } = require("./services/subscriptions");

async function initializeDatabase() {
  console.log("[Init] Initializing database tables...");
  const start = Date.now();

  try {
    await Promise.all([
      ensureBannersTable(),
      ensureAnnouncementsTable(),
      ensurePromotionsTables(),
      ensureNewsTable(),
      ensureImagesTable(),
      ensureSettingsTable(),
      ensureAdminUsers(),
      ensureAnalyticsTables(),
      ensureCreditsTable(),
      ensureCategoriesTable(),
      ensureSubscriptionsTable(),
    ]);

    console.log(`[Init] All database tables ready (${Date.now() - start}ms)`);
  } catch (error) {
    console.error("[Init] Database initialization error:", error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };
