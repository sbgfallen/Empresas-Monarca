const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
  getActiveAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../services/announcements");

// ─── Public ───────────────────────────────────────────

router.get("/", async (_req, res) => {
  try {
    const announcements = await getActiveAnnouncements();
    return res.json({ announcements });
  } catch (error) {
    console.error("[Announcements] List error:", error);
    return res.status(500).json({ error: "Error al obtener anuncios." });
  }
});

// ─── Admin ────────────────────────────────────────────

router.get("/all", requireAdmin, async (_req, res) => {
  try {
    const announcements = await getAllAnnouncements();
    return res.json({ announcements });
  } catch (error) {
    console.error("[Announcements] Admin list error:", error);
    return res.status(500).json({ error: "Error al obtener anuncios." });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    const item = await getAnnouncementById(id);
    if (!item) return res.status(404).json({ error: "Anuncio no encontrado." });
    return res.json({ announcement: item });
  } catch (error) {
    console.error("[Announcements] Get error:", error);
    return res.status(500).json({ error: "Error al obtener anuncio." });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, content, type, linkUrl, linkLabel, icon, isActive, startsAt, expiresAt, sortOrder } = req.body;
    if (!title) return res.status(400).json({ error: "El título es requerido." });

    const announcement = await createAnnouncement({ title, content, type, linkUrl, linkLabel, icon, isActive, startsAt, expiresAt, sortOrder });
    return res.status(201).json({ announcement });
  } catch (error) {
    console.error("[Announcements] Create error:", error);
    return res.status(500).json({ error: "Error al crear anuncio." });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });

    const updated = await updateAnnouncement(id, req.body);
    if (!updated) return res.status(404).json({ error: "Anuncio no encontrado." });
    return res.json({ announcement: updated });
  } catch (error) {
    console.error("[Announcements] Update error:", error);
    return res.status(500).json({ error: "Error al actualizar anuncio." });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    await deleteAnnouncement(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Announcements] Delete error:", error);
    return res.status(500).json({ error: "Error al eliminar anuncio." });
  }
});

module.exports = router;
