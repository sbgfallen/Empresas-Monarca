const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
  getPublishedNews,
  getNewsBySlug,
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require("../services/news");

// ─── Public ───────────────────────────────────────────

router.get("/", async (_req, res) => {
  try {
    const news = await getPublishedNews();
    return res.json({ news });
  } catch (error) {
    console.error("[News] List error:", error);
    return res.status(500).json({ error: "Error al obtener noticias." });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await getNewsBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: "Noticia no encontrada." });
    return res.json({ news: item });
  } catch (error) {
    console.error("[News] Slug error:", error);
    return res.status(500).json({ error: "Error al obtener noticia." });
  }
});

// ─── Admin ────────────────────────────────────────────

router.get("/all", requireAdmin, async (_req, res) => {
  try {
    const news = await getAllNews();
    return res.json({ news });
  } catch (error) {
    console.error("[News] Admin list error:", error);
    return res.status(500).json({ error: "Error al obtener noticias." });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    const item = await getNewsById(id);
    if (!item) return res.status(404).json({ error: "Noticia no encontrada." });
    return res.json({ news: item });
  } catch (error) {
    console.error("[News] Get error:", error);
    return res.status(500).json({ error: "Error al obtener noticia." });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, imageUrl, category, tags, isPublished, publishedAt } = req.body;
    if (!title) return res.status(400).json({ error: "El título es requerido." });

    const news = await createNews({ title, excerpt, content, imageUrl, category, tags, isPublished, publishedAt });
    return res.status(201).json({ news });
  } catch (error) {
    console.error("[News] Create error:", error);
    return res.status(500).json({ error: "Error al crear noticia." });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });

    const updated = await updateNews(id, req.body);
    if (!updated) return res.status(404).json({ error: "Noticia no encontrada." });
    return res.json({ news: updated });
  } catch (error) {
    console.error("[News] Update error:", error);
    return res.status(500).json({ error: "Error al actualizar noticia." });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    await deleteNews(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("[News] Delete error:", error);
    return res.status(500).json({ error: "Error al eliminar noticia." });
  }
});

module.exports = router;
