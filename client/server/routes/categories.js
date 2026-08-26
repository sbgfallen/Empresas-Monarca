const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const {
  getAllCategories,
  createCategory,
  deleteCategory,
} = require("../services/categories");

// GET /api/categories — list all categories
router.get("/", async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (error) {
    console.error("[Categories] GET error:", error.message);
    res.status(500).json({ error: "Error al obtener categorías." });
  }
});

// POST /api/categories — create a new category
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "El nombre es requerido." });
    }
    const category = await createCategory({ name: name.trim() });
    res.status(201).json({ category });
  } catch (error) {
    console.error("[Categories] POST error:", error.message);
    res.status(500).json({ error: "Error al crear categoría." });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await deleteCategory(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("[Categories] DELETE error:", error.message);
    res.status(500).json({ error: "Error al eliminar categoría." });
  }
});

module.exports = router;
