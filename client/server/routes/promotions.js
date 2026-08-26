const express = require("express");

const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const { sendNewPromotionNotification } = require("../services/subscriptions");
const {
  getAllPromotions,
  getActivePromotions,
  getFlashSales,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  addProductsToPromotion,
  removeProductFromPromotion,
  getProductsForPromotion,
} = require("../services/promotions");

// ─── Public Endpoints ─────────────────────────────────

// GET /api/promotions - Active promotions with products
router.get("/", async (_req, res) => {
  try {
    const promotions = await getActivePromotions();

    return res.json({ promotions });
  } catch (error) {
    console.error("[Promotions] Error:", error);

    return res.status(500).json({
      error: "Error al obtener promociones.",
    });
  }
});

// GET /api/promotions/flash-sales - Active flash sales (≤ 48h)
router.get("/flash-sales", async (_req, res) => {
  try {
    const flashSales = await getFlashSales();

    return res.json({ flashSales });
  } catch (error) {
    console.error("[Promotions] Flash sales error:", error);

    return res.status(500).json({
      error: "Error al obtener flash sales.",
    });
  }
});

// ─── Admin Endpoints ──────────────────────────────────

// GET /api/promotions/all - All promotions (admin)
router.get("/all", requireAdmin, async (_req, res) => {
  try {
    const promotions = await getAllPromotions();

    return res.json({ promotions });
  } catch (error) {
    console.error("[Promotions] Admin list error:", error);

    return res.status(500).json({
      error: "Error al obtener promociones.",
    });
  }
});

// GET /api/promotions/:id - Single promotion (admin)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const promotion = await getPromotionById(id);

    if (!promotion) {
      return res.status(404).json({ error: "Promoción no encontrada." });
    }

    const products = await getProductsForPromotion(id);
    promotion.products = products;

    return res.json({ promotion });
  } catch (error) {
    console.error("[Promotions] Get error:", error);

    return res.status(500).json({
      error: "Error al obtener promoción.",
    });
  }
});

// POST /api/promotions - Create promotion (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      bannerImage,
      productIds,
    } = req.body;

    if (!title || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        error: "Título, tipo de descuento, valor, fecha inicio y fin son requeridos.",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        error: "Tipo de descuento inválido. Usa 'percentage' o 'fixed'.",
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        error: "El valor del descuento debe ser mayor a 0.",
      });
    }

    const promotion = await createPromotion({
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      bannerImage,
    });

    // Attach products if provided
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await addProductsToPromotion(promotion.id, productIds);
    }

    const products = await getProductsForPromotion(promotion.id);
    promotion.products = products;

    // Notify subscribers about new promotion
    const serverUrl = process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const promotionUrl = `${serverUrl}/#promociones`;
    
    sendNewPromotionNotification(promotion.title, promotionUrl).catch((err) =>
      console.error("[Promotions] Subscriber notification error:", err.message)
    );

    return res.status(201).json({ promotion });
  } catch (error) {
    console.error("[Promotions] Create error:", error);

    return res.status(500).json({
      error: "Error al crear promoción.",
    });
  }
});

// PUT /api/promotions/:id - Update promotion (admin)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const { title, description, discountType, discountValue, startDate, endDate, isActive, bannerImage } = req.body;

    const fields = {};

    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (discountType !== undefined) {
      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({ error: "Tipo de descuento inválido." });
      }
      fields.discount_type = discountType;
    }
    if (discountValue !== undefined) fields.discount_value = discountValue;
    if (startDate !== undefined) fields.start_date = startDate;
    if (endDate !== undefined) fields.end_date = endDate;
    if (isActive !== undefined) fields.is_active = isActive;
    if (bannerImage !== undefined) fields.banner_image = bannerImage;

    const updated = await updatePromotion(id, fields);

    if (!updated) {
      return res.status(404).json({ error: "Promoción no encontrada." });
    }

    const products = await getProductsForPromotion(id);
    updated.products = products;

    return res.json({ promotion: updated });
  } catch (error) {
    console.error("[Promotions] Update error:", error);

    return res.status(500).json({
      error: "Error al actualizar promoción.",
    });
  }
});

// DELETE /api/promotions/:id - Delete promotion (admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    await deletePromotion(id);

    return res.json({ success: true });
  } catch (error) {
    console.error("[Promotions] Delete error:", error);

    return res.status(500).json({
      error: "Error al eliminar promoción.",
    });
  }
});

// POST /api/promotions/:id/products - Add products to promotion (admin)
router.post("/:id/products", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        error: "Se requiere un array de productIds.",
      });
    }

    await addProductsToPromotion(id, productIds);

    const products = await getProductsForPromotion(id);

    return res.json({ products });
  } catch (error) {
    console.error("[Promotions] Add products error:", error);

    return res.status(500).json({
      error: "Error al agregar productos a la promoción.",
    });
  }
});

// DELETE /api/promotions/:id/products/:productId - Remove product from promotion (admin)
router.delete("/:id/products/:productId", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const productId = Number(req.params.productId);

    if (!id || id < 1 || !productId || productId < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    await removeProductFromPromotion(id, productId);

    return res.json({ success: true });
  } catch (error) {
    console.error("[Promotions] Remove product error:", error);

    return res.status(500).json({
      error: "Error al eliminar producto de la promoción.",
    });
  }
});

module.exports = router;
