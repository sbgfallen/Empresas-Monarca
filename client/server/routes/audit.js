const express = require("express");
const { requireSession, requireRoles } = require("../middleware/sessionAuth");
const { getAuditLogs, countAuditLogs } = require("../services/audit");

const router = express.Router();

router.get("/", requireSession, requireRoles(["owner", "super_admin"]), async (req, res) => {
  try {
    const { entity, userId, limit, offset } = req.query;
    return res.json(await getAuditLogs({ entity, userId: userId ? parseInt(userId) : undefined, limit: limit ? parseInt(limit) : 50, offset: offset ? parseInt(offset) : 0 }));
  } catch (error) { console.error("[Audit] List error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.get("/count", requireSession, requireRoles(["owner", "super_admin"]), async (req, res) => {
  try {
    const { entity, userId } = req.query;
    return res.json({ count: await countAuditLogs({ entity, userId: userId ? parseInt(userId) : undefined }) });
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

module.exports = router;
