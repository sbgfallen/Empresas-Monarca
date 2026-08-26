const express = require("express");

const router = express.Router();

const { requireAdmin, requireRoles } = require("../middleware/auth");
const { getSetting, getAllSettings, updateSetting } = require("../services/settings");

// GET /api/settings/:key - Public endpoint for individual settings (e.g. whatsapp_number)
router.get("/:key", async (req, res) => {
  try {
    const value = await getSetting(req.params.key);

    if (value === null) {
      return res.status(404).json({ error: "Setting not found" });
    }

    return res.json({ key: req.params.key, value });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/settings - Get all settings (admin only, owner/super_admin)
router.get("/", requireAdmin, requireRoles(["owner", "super_admin"]), async (_req, res) => {
  try {
    const settings = await getAllSettings();
    return res.json({ settings });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/settings/:key - Update a setting (owner only)
router.put("/:key", requireAdmin, requireRoles(["owner"]), async (req, res) => {
  try {
    const key = req.params.key;
    const value = String(req.body.value ?? "");

    const result = await updateSetting(key, value, req.admin.id);

    return res.json({ setting: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
