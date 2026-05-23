const db = require("../config/db");

let setupPromise;

async function ensurePromotionsTables() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS promotions (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
          discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
          start_date TIMESTAMPTZ NOT NULL,
          end_date TIMESTAMPTZ NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          banner_image TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS promotion_products (
          id SERIAL PRIMARY KEY,
          promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(promotion_id, product_id)
        )
      `);

      // Indexes
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion
        ON promotion_products(promotion_id)
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_promotion_products_product
        ON promotion_products(product_id)
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_promotions_active_dates
        ON promotions(start_date, end_date)
      `);
    })();
  }

  return setupPromise;
}

// ─── Helpers ──────────────────────────────────────────

function calculateDiscountedPrice(originalPrice, discountType, discountValue) {
  const price = Number(originalPrice) || 0;

  if (discountType === "percentage") {
    return Math.round(price * (1 - Math.min(discountValue, 100) / 100));
  }

  // fixed
  return Math.max(0, price - discountValue);
}

// ─── CRUD: Promotions ─────────────────────────────────

async function getAllPromotions() {
  await ensurePromotionsTables();

  const result = await db.query(`
    SELECT
      p.*,
      pr.id AS product_id,
      pr.title AS product_title,
      pr.price AS product_price,
      pr.image AS product_image,
      pr.category AS product_category,
      pr.stock AS product_stock
    FROM promotions p
    LEFT JOIN promotion_products pp ON pp.promotion_id = p.id
    LEFT JOIN products pr ON pr.id = pp.product_id
    ORDER BY p.start_date DESC, pr.title ASC
  `);

  const promoMap = new Map();

  for (const row of result.rows) {
    if (!promoMap.has(row.id)) {
      promoMap.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        discount_type: row.discount_type,
        discount_value: row.discount_value,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        banner_image: row.banner_image,
        created_at: row.created_at,
        updated_at: row.updated_at,
        products: [],
      });
    }

    if (row.product_id) {
      const promo = promoMap.get(row.id);
      promo.products.push({
        id: row.product_id,
        title: row.product_title,
        price: row.product_price,
        image: row.product_image,
        category: row.product_category,
        stock: row.product_stock,
        discounted_price: calculateDiscountedPrice(
          row.product_price,
          row.discount_type,
          row.discount_value
        ),
      });
    }
  }

  return Array.from(promoMap.values());
}

async function getActivePromotions() {
  await ensurePromotionsTables();

  const result = await db.query(`
    SELECT
      p.*,
      pr.id AS product_id,
      pr.title AS product_title,
      pr.price AS product_price,
      pr.image AS product_image,
      pr.category AS product_category,
      pr.stock AS product_stock
    FROM promotions p
    LEFT JOIN promotion_products pp ON pp.promotion_id = p.id
    LEFT JOIN products pr ON pr.id = pp.product_id
    WHERE p.is_active = true
      AND p.start_date <= NOW()
      AND p.end_date >= NOW()
    ORDER BY p.end_date ASC, pr.title ASC
  `);

  const promoMap = new Map();

  for (const row of result.rows) {
    if (!promoMap.has(row.id)) {
      promoMap.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        discount_type: row.discount_type,
        discount_value: row.discount_value,
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active,
        banner_image: row.banner_image,
        created_at: row.created_at,
        updated_at: row.updated_at,
        products: [],
      });
    }

    if (row.product_id) {
      const promo = promoMap.get(row.id);
      promo.products.push({
        id: row.product_id,
        title: row.product_title,
        price: row.product_price,
        image: row.product_image,
        category: row.product_category,
        stock: row.product_stock,
        original_price: Number(row.product_price),
        discounted_price: calculateDiscountedPrice(
          row.product_price,
          row.discount_type,
          row.discount_value
        ),
      });
    }
  }

  return Array.from(promoMap.values());
}

async function getFlashSales() {
  const all = await getActivePromotions();

  // Flash sales: promotions lasting <= 48 hours
  return all.filter((p) => {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const hours = (end - start) / (1000 * 60 * 60);

    return hours <= 48;
  });
}

async function getPromotionById(id) {
  await ensurePromotionsTables();

  const result = await db.query("SELECT * FROM promotions WHERE id = $1", [
    id,
  ]);

  return result.rows[0] || null;
}

async function createPromotion({
  title,
  description,
  discountType,
  discountValue,
  startDate,
  endDate,
  isActive,
  bannerImage,
}) {
  await ensurePromotionsTables();

  const result = await db.query(
    `
    INSERT INTO promotions
      (title, description, discount_type, discount_value, start_date, end_date, is_active, banner_image)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      title,
      description || "",
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive !== false,
      bannerImage || "",
    ]
  );

  return result.rows[0];
}

async function updatePromotion(id, fields) {
  await ensurePromotionsTables();

  const sets = [];
  const params = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      const col = key
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase();
      sets.push(`${col} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const result = await db.query(
    `
    UPDATE promotions
    SET ${sets.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    params
  );

  return result.rows[0] || null;
}

async function deletePromotion(id) {
  await ensurePromotionsTables();

  await db.query("DELETE FROM promotions WHERE id = $1", [id]);

  return { success: true };
}

// ─── Promotion-Products ───────────────────────────────

async function addProductsToPromotion(promotionId, productIds) {
  await ensurePromotionsTables();

  const results = [];

  for (const productId of productIds) {
    try {
      const result = await db.query(
        `
        INSERT INTO promotion_products (promotion_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT (promotion_id, product_id) DO NOTHING
        RETURNING *
        `,
        [promotionId, productId]
      );

      if (result.rows[0]) results.push(result.rows[0]);
    } catch {
      // Skip invalid product IDs
    }
  }

  return results;
}

async function removeProductFromPromotion(promotionId, productId) {
  await ensurePromotionsTables();

  await db.query(
    "DELETE FROM promotion_products WHERE promotion_id = $1 AND product_id = $2",
    [promotionId, productId]
  );

  return { success: true };
}

async function getProductsForPromotion(promotionId) {
  await ensurePromotionsTables();

  const result = await db.query(
    `
    SELECT p.*
    FROM products p
    INNER JOIN promotion_products r ON r.product_id = p.id
    WHERE r.promotion_id = $1
    ORDER BY p.title ASC
    `,
    [promotionId]
  );

  return result.rows;
}

module.exports = {
  ensurePromotionsTables,
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
  calculateDiscountedPrice,
};
