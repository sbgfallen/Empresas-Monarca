const express = require("express");

const router = express.Router();

const db = require("../config/db");

const upload = require("../middleware/upload");
const { requireAdmin } = require("../middleware/auth");
const { getActivePromotions, calculateDiscountedPrice } = require("../services/promotions");
const { sendNewProductNotification } = require("../services/subscriptions");


// Ensure down_payment column exists (idempotent)
async function ensureDownPaymentColumn() {
  try {
    await db.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS down_payment NUMERIC DEFAULT 0
    `);
  } catch {
    // Table may not exist yet
  }
}

// GET PRODUCTS (with active discount info)
router.get("/", async (req, res) => {

  try {

    await ensureDownPaymentColumn();

    // Run product query and active promotions in parallel
    const [productsResult, activePromos] = await Promise.all([
      db.query("SELECT * FROM products ORDER BY id DESC"),
      getActivePromotions().catch(() => []),
    ]);

    const products = productsResult.rows;

    // Build discount map from promotions
    const discountMap = new Map();

    for (const promo of activePromos) {
      for (const product of promo.products) {
        discountMap.set(product.id, {
          promotionId: promo.id,
          promotionTitle: promo.title,
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
          discountedPrice: product.discounted_price,
          endsAt: promo.end_date,
        });
      }
    }

    const enriched = products.map((p) => {
      const discount = discountMap.get(p.id);

      if (discount) {
        return {
          ...p,
          original_price: Number(p.price),
          price: discount.discountedPrice,
          discount: discount,
        };
      }

      return p;
    });

    return res.json(enriched);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Server error",
    });

  }

});



// UPLOAD IMAGE
router.post(
  "/upload",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {

    try {
      // Cloudinary returns full URL in req.file.path
      // Local disk returns filename, construct URL
      const imageUrl =
        req.file.path ||
        `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;

      res.json({
        imageUrl,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Upload error",
      });

    }

  }
);



// CREATE PRODUCT
router.post("/", requireAdmin, async (req, res) => {

  try {

    const {
      title,
      description,
      price,
      stock,
      image,
      category,
      financing,
      down_payment,
    } = req.body;

    const newProduct = await db.query(
      `
      INSERT INTO products
      (
        title,
        description,
        price,
        stock,
        image,
        category,
        financing,
        down_payment
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        title,
        description,
        price,
        stock,
        image,
        category,
        financing,
        down_payment || 0,
      ]
    );

    // Notify subscribers about new product
    const productId = newProduct.rows[0].id;
    const serverUrl = process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const productUrl = `${serverUrl}/productos/${productId}`;
    
    sendNewProductNotification(productUrl).catch((err) =>
      console.error("[Products] Subscriber notification error:", err.message)
    );

    res.json(newProduct.rows[0]);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Server error",
    });

  }

});

// DELETE PRODUCT
router.delete("/:id", requireAdmin, async (req, res) => {

  try {

    await db.query(
      "DELETE FROM products WHERE id = $1",
      [req.params.id]
    );

    res.json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Server error",
    });

  }

});

// GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const result = await db.query("SELECT * FROM products WHERE id = $1", [id]);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    // Get active discount info
    const activePromos = await getActivePromotions().catch(() => []);
    let discount = null;
    for (const promo of activePromos) {
      for (const p of promo.products) {
        if (p.id === product.id) {
          discount = {
            promotionId: promo.id,
            promotionTitle: promo.title,
            discountType: promo.discount_type,
            discountValue: promo.discount_value,
            discountedPrice: p.discounted_price,
            endsAt: promo.end_date,
          };
          product.original_price = Number(product.price);
          product.price = p.discounted_price;
          break;
        }
      }
      if (discount) break;
    }

    if (discount) {
      product.discount = discount;
    }

    return res.json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// UPDATE PRODUCT
router.put("/:id", requireAdmin, async (req, res) => {

  try {

    const {
      title,
      description,
      price,
      stock,
      category,
      down_payment,
    } = req.body;

    const updated =
      await db.query(
        `
        UPDATE products
        SET
          title = $1,
          description = $2,
          price = $3,
          stock = $4,
          category = $5,
          down_payment = $6
        WHERE id = $7
        RETURNING *
        `,
        [
          title,
          description,
          price,
          stock,
          category,
          down_payment || 0,
          req.params.id,
        ]
      );

    res.json(updated.rows[0]);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Server error",
    });

  }

});

module.exports = router;
