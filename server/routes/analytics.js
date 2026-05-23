const express = require("express");

const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const { getDashboardStats } = require("../services/analytics");

// GET /api/analytics/dashboard - Full dashboard data (admin only)
router.get("/dashboard", requireAdmin, async (_req, res) => {
  try {
    const stats = await getDashboardStats();

    return res.json(stats);
  } catch (error) {
    console.error("[Analytics] Error:", error);

    return res.status(500).json({
      error: "Error al obtener estadísticas.",
    });
  }
});

module.exports = router;
