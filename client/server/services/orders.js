const db = require("../config/db");
const crypto = require("crypto");

let setupPromise;

async function ensureOrdersTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY, number TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'RECIBIDO',
          customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, customer_email TEXT,
          delivery_type TEXT NOT NULL DEFAULT 'RETIRO', address TEXT, reference TEXT, notes TEXT,
          subtotal NUMERIC NOT NULL DEFAULT 0, delivery_cost NUMERIC NOT NULL DEFAULT 0,
          total NUMERIC NOT NULL DEFAULT 0, payment_type TEXT NOT NULL DEFAULT 'EFECTIVO',
          payment_status TEXT NOT NULL DEFAULT 'PENDIENTE', tracking_token TEXT UNIQUE,
          customer_id INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
      )`);
      await db.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id), name TEXT NOT NULL, price NUMERIC NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1, total NUMERIC NOT NULL, options TEXT
      )`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(number)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`);
      await db.query(`CREATE TABLE IF NOT EXISTS order_counter (id INTEGER PRIMARY KEY DEFAULT 1, value INTEGER NOT NULL DEFAULT 0)`);
      await db.query(`INSERT INTO order_counter (id, value) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`);
    })();
  }
  return setupPromise;
}

function generateTrackingToken() { return crypto.randomBytes(24).toString("base64url"); }
function buildOrderNumber(seq) { return `EM-${1000 + seq}`; }

async function calculateOrderTotals(items) {
  let subtotal = 0;
  const enrichedItems = [];
  for (const item of items) {
    const productResult = await db.query("SELECT * FROM products WHERE id = $1", [item.product_id]);
    const product = productResult.rows[0];
    if (!product) throw new Error(`Producto #${item.product_id} no encontrado`);
    const unitPrice = Number(product.price);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    enrichedItems.push({ product_id: product.id, name: product.title, price: unitPrice, quantity: item.quantity, total: itemTotal, options: item.options || null });
  }
  return { subtotal, enrichedItems };
}

async function createOrder(input) {
  await ensureOrdersTable();
  const { subtotal, enrichedItems } = await calculateOrderTotals(input.items);
  const deliveryCost = input.delivery_type === "DOMICILIO" ? 8000 : 0;
  const total = subtotal + deliveryCost;
  const counterResult = await db.query("UPDATE order_counter SET value = value + 1 WHERE id = 1 RETURNING value");
  const orderNumber = buildOrderNumber(counterResult.rows[0].value);
  const trackingToken = generateTrackingToken();
  const orderResult = await db.query(
    `INSERT INTO orders (number, customer_name, customer_phone, customer_email, delivery_type,
     address, reference, notes, subtotal, delivery_cost, total, payment_type, tracking_token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [orderNumber, input.customer_name, input.customer_phone, input.customer_email || null,
     input.delivery_type, input.address || null, input.reference || null, input.notes || null,
     subtotal, deliveryCost, total, input.payment_type, trackingToken]
  );
  const order = orderResult.rows[0];
  for (const item of enrichedItems) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, name, price, quantity, total, options)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [order.id, item.product_id, item.name, item.price, item.quantity, item.total, item.options]
    );
  }
  return { order, trackingToken };
}

async function getOrders({ status, limit = 50, offset = 0 } = {}) {
  await ensureOrdersTable();
  let query = "SELECT * FROM orders WHERE deleted_at IS NULL";
  const params = []; let pi = 1;
  if (status) { query += ` AND status = $${pi}`; params.push(status); pi++; }
  query += ` ORDER BY created_at DESC LIMIT $${pi} OFFSET $${pi + 1}`;
  params.push(limit, offset);
  const result = await db.query(query, params);
  for (const order of result.rows) {
    const itemsResult = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    order.items = itemsResult.rows;
  }
  return result.rows;
}

async function getOrderById(id) {
  await ensureOrdersTable();
  const result = await db.query("SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL", [id]);
  const order = result.rows[0];
  if (!order) return null;
  const itemsResult = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  order.items = itemsResult.rows;
  return order;
}

async function getOrderByTrackingToken(token) {
  await ensureOrdersTable();
  const result = await db.query("SELECT * FROM orders WHERE tracking_token = $1 AND deleted_at IS NULL", [token]);
  const order = result.rows[0];
  if (!order) return null;
  const itemsResult = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  order.items = itemsResult.rows;
  return { number: order.number, status: order.status, items: order.items, delivery_type: order.delivery_type, total: order.total, payment_status: order.payment_status, created_at: order.created_at };
}

async function updateOrderStatus(id, status) {
  await ensureOrdersTable();
  const result = await db.query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`, [status, id]);
  return result.rows[0] || null;
}

async function updatePaymentStatus(id, paymentStatus) {
  await ensureOrdersTable();
  const result = await db.query(`UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`, [paymentStatus, id]);
  return result.rows[0] || null;
}

async function deleteOrder(id) {
  await ensureOrdersTable();
  await db.query("UPDATE orders SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
}

async function getOrderStats() {
  await ensureOrdersTable();
  const result = await db.query(`
    SELECT COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 'RECIBIDO' THEN 1 ELSE 0 END), 0)::int AS received,
      COALESCE(SUM(CASE WHEN status = 'ENTREGADO' THEN 1 ELSE 0 END), 0)::int AS delivered,
      COALESCE(SUM(CASE WHEN status = 'CANCELADO' THEN 1 ELSE 0 END), 0)::int AS cancelled,
      COALESCE(SUM(total), 0)::numeric AS revenue
    FROM orders WHERE deleted_at IS NULL
  `);
  return result.rows[0];
}

module.exports = { ensureOrdersTable, createOrder, getOrders, getOrderById, getOrderByTrackingToken, updateOrderStatus, updatePaymentStatus, deleteOrder, getOrderStats };
