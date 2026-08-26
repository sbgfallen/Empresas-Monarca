const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
  getActiveBanners,
  getBannersByPosition,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../services/banners");

// ─── Public ───────────────────────────────────────────

router.get("/", async (_req, res) => {
  try {
    const banners = await getActiveBanners();
    return res.json({ banners });
  } catch (error) {
    console.error("[Banners] List error:", error);
    return res.status(500).json({ error: "Error al obtener banners." });
  }
});

router.get("/position/:position", async (req, res) => {
  try {
    const banners = await getBannersByPosition(req.params.position);
    return res.json({ banners });
  } catch (error) {
    console.error("[Banners] Position error:", error);
    return res.status(500).json({ error: "Error al obtener banners." });
  }
});

// ─── Admin ────────────────────────────────────────────

router.get("/all", requireAdmin, async (_req, res) => {
  try {
    const banners = await getAllBanners();
    return res.json({ banners });
  } catch (error) {
    console.error("[Banners] Admin list error:", error);
    return res.status(500).json({ error: "Error al obtener banners." });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    const banner = await getBannerById(id);
    if (!banner) return res.status(404).json({ error: "Banner no encontrado." });
    return res.json({ banner });
  } catch (error) {
    console.error("[Banners] Get error:", error);
    return res.status(500).json({ error: "Error al obtener banner." });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, linkLabel, position, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: "Título e imagen son requeridos." });

    const banner = await createBanner({ title, imageUrl, linkUrl, linkLabel, position, isActive, sortOrder });
    return res.status(201).json({ banner });
  } catch (error) {
    console.error("[Banners] Create error:", error);
    return res.status(500).json({ error: "Error al crear banner." });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });

    const updated = await updateBanner(id, req.body);
    if (!updated) return res.status(404).json({ error: "Banner no encontrado." });
    return res.json({ banner: updated });
  } catch (error) {
    console.error("[Banners] Update error:", error);
    return res.status(500).json({ error: "Error al actualizar banner." });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    await deleteBanner(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Banners] Delete error:", error);
    return res.status(500).json({ error: "Error al eliminar banner." });
  }
});

module.exports = router;
