const db = require("../config/db");

let setupPromise;

async function ensureAnalyticsTables() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS product_views (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Create index for faster queries
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_product_views_product_id
        ON product_views(product_id)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at
        ON product_views(viewed_at)
      `);

      // Try to add views_count column to products if it doesn't exist
      try {
        await db.query(`
          ALTER TABLE products
          ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0
        `);
      } catch {
        // Column may already exist
      }
    })();
  }

  return setupPromise;
}

async function getDashboardStats() {
  await ensureAnalyticsTables();

  const [revenueResult, financedResult, creditsResult, productsResult, lowStockResult, monthlyResult] =
    await Promise.all([
      // Total revenue from paid credits
      db.query(`
        SELECT
          COALESCE(SUM(total_payment), 0)::numeric AS total_revenue,
          COUNT(*)::int AS paid_count
        FROM credits
        WHERE status = 'paid'
      `),

      // Total financed (all credits)
      db.query(`
        SELECT
          COALESCE(SUM(amount), 0)::numeric AS total_financed,
          COUNT(*)::int AS total_requests
        FROM credits
      `),

      // Credits by status for quick stats
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0)::int AS approved,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0)::int AS paid,
          COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0)::int AS rejected
        FROM credits
      `),

      // Product stats
      db.query(`
        SELECT
          COUNT(*)::int AS total_products,
          COALESCE(SUM(views_count), 0)::int AS total_views,
          COALESCE(AVG(price::numeric), 0)::numeric AS avg_price
        FROM products
      `),

      // Low stock products
      db.query(`
        SELECT
          id, title, stock, price, category, image
        FROM products
        WHERE stock IS NOT NULL
          AND stock::text ~ '^[0-9]+$'
          AND stock::integer <= 5
          AND stock::integer > 0
        ORDER BY stock::integer ASC
        LIMIT 10
      `),

      // Monthly financing data for charts (last 12 months)
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
          COUNT(*)::int AS requests,
          COALESCE(SUM(amount), 0)::numeric AS financed,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total_payment ELSE 0 END), 0)::numeric AS revenue
        FROM credits
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `),
    ]);

  // Most viewed products
  const mostViewedResult = await db.query(`
    SELECT
      p.id,
      p.title,
      p.price,
      p.category,
      p.image,
      COALESCE(p.views_count, 0)::int AS views,
      COALESCE(pv.recent_views, 0)::int AS recent_views
    FROM products p
    LEFT JOIN (
      SELECT product_id, COUNT(*)::int AS recent_views
      FROM product_views
      WHERE viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY product_id
    ) pv ON pv.product_id = p.id
    ORDER BY COALESCE(p.views_count, 0) DESC
    LIMIT 10
  `);

  const revenue = revenueResult.rows[0];
  const financed = financedResult.rows[0];
  const creditStats = creditsResult.rows[0];
  const productStats = productsResult.rows[0];

  // Get pending approval amount
  const pendingAmount = await db.query(`
    SELECT COALESCE(SUM(amount), 0)::numeric AS total
    FROM credits WHERE status = 'pending'
  `);

  return {
    revenue: {
      total: Number(revenue.total_revenue),
      paidCount: revenue.paid_count,
    },
    financed: {
      total: Number(financed.total_financed),
      totalRequests: financed.total_requests,
    },
    pendingAmount: Number(pendingAmount.rows[0].total),
    creditStats: {
      total: creditStats.total,
      pending: creditStats.pending,
      approved: creditStats.approved,
      paid: creditStats.paid,
      rejected: creditStats.rejected,
    },
    products: {
      total: productStats.total_products,
      totalViews: productStats.total_views,
      avgPrice: Number(productStats.avg_price),
    },
    lowStock: lowStockResult.rows.map((p) => ({
      id: p.id,
      title: p.title,
      stock: p.stock,
      price: p.price,
      category: p.category,
      image: p.image,
    })),
    mostViewed: mostViewedResult.rows.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      image: p.image,
      views: p.views,
      recentViews: p.recent_views,
    })),
    monthly: monthlyResult.rows.map((r) => ({
      month: r.month,
      requests: r.requests,
      financed: Number(r.financed),
      revenue: Number(r.revenue),
    })),
  };
}

async function trackProductView(productId) {
  await ensureAnalyticsTables();

  await Promise.all([
    db.query(
      "INSERT INTO product_views (product_id) VALUES ($1)",
      [productId]
    ),
    db.query(
      "UPDATE products SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1",
      [productId]
    ),
  ]);
}

module.exports = {
  ensureAnalyticsTables,
  getDashboardStats,
  trackProductView,
};
