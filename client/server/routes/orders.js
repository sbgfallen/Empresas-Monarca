const express = require("express");
const { validate } = require("../middleware/validate");
const { requireSession } = require("../middleware/sessionAuth");
const { audit } = require("../services/audit");
const orders = require("../services/orders");
const { orderCreateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", requireSession, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await orders.getOrders({ status, limit: limit ? parseInt(limit) : 50, offset: offset ? parseInt(offset) : 0 });
    return res.json(result);
  } catch (error) { console.error("[Orders] List error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.get("/stats", requireSession, async (req, res) => {
  try { return res.json(await orders.getOrderStats()); }
  catch (error) { console.error("[Orders] Stats error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.get("/tracking/:token", async (req, res) => {
  try {
    const order = await orders.getOrderByTrackingToken(req.params.token);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.json(order);
  } catch (error) { console.error("[Orders] Tracking error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.post("/", validate(orderCreateSchema), async (req, res) => {
  try {
    const { order, trackingToken } = await orders.createOrder(req.body);
    await audit(null, "CREAR", "Order", order.id, { number: order.number, total: order.total }, req.ip);
    return res.json({ order, trackingToken });
  } catch (error) { console.error("[Orders] Create error:", error.message); return res.status(500).json({ error: error.message || "Error del servidor" }); }
});

router.get("/:id", requireSession, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido" });
    const order = await orders.getOrderById(id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.json(order);
  } catch (error) { console.error("[Orders] Get error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.patch("/:id/status", requireSession, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["RECIBIDO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Estado inválido" });
    const order = await orders.updateOrderStatus(parseInt(req.params.id), status);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    await audit(req.user, "EDITAR", "Order", order.id, { action: "status_change", newStatus: status }, req.ip);
    return res.json(order);
  } catch (error) { console.error("[Orders] Status error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.delete("/:id", requireSession, async (req, res) => {
  try {
    await orders.deleteOrder(parseInt(req.params.id));
    await audit(req.user, "ELIMINAR", "Order", parseInt(req.params.id), null, req.ip);
    return res.json({ success: true });
  } catch (error) { console.error("[Orders] Delete error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

module.exports = router;
