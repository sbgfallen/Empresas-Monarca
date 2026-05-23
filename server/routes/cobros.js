const express = require("express");

const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const {
  getAllCobros,
  getCobroById,
  createCobro,
  updateCobroStatus,
  deleteCobro,
  addPayment,
  getPaymentsByCobroId,
  getCobroStats,
} = require("../services/cobros");

// GET /api/cobros - List all cobros (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const type = String(req.query.type || "").trim().toLowerCase();
    const status = String(req.query.status || "").trim().toLowerCase();
    const cobros = await getAllCobros({
      type: ["loan", "quote"].includes(type) ? type : undefined,
      status: ["active", "paid", "cancelled"].includes(status) ? status : undefined,
    });

    return res.json({ cobros });
  } catch (error) {
    console.error("[Cobros] GET / error:", error.message);
    return res.status(500).json({ error: "Error al obtener cobros." });
  }
});

// GET /api/cobros/stats - Get aggregate stats (admin only)
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await getCobroStats();
    return res.json({ stats });
  } catch (error) {
    console.error("[Cobros] GET /stats error:", error.message);
    return res.status(500).json({ error: "Error al obtener estadísticas." });
  }
});

// GET /api/cobros/:id - Get single cobro (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const cobro = await getCobroById(id);
    if (!cobro) {
      return res.status(404).json({ error: "Cobro no encontrado." });
    }

    return res.json({ cobro });
  } catch (error) {
    console.error("[Cobros] GET /:id error:", error.message);
    return res.status(500).json({ error: "Error al obtener cobro." });
  }
});

// POST /api/cobros - Create a new cobro (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const type = String(req.body.type || "loan").trim().toLowerCase();
    const clientName = String(req.body.clientName || "").trim();
    const clientPhone = String(req.body.clientPhone || "").trim();
    const amount = Number(req.body.amount);
    const description = String(req.body.description || "").trim();

    if (!clientName) {
      return res.status(400).json({ error: "Nombre del cliente requerido." });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Monto inválido." });
    }

    if (!["loan", "quote"].includes(type)) {
      return res.status(400).json({ error: "Tipo inválido. Usa 'loan' o 'quote'." });
    }

    const cobro = await createCobro({
      type,
      clientName,
      clientPhone,
      amount,
      description,
    });

    return res.status(201).json({ cobro });
  } catch (error) {
    console.error("[Cobros] POST / error:", error.message);
    return res.status(500).json({ error: "Error al crear cobro." });
  }
});

// POST /api/cobros/:id/payments - Add a payment to a cobro (admin only)
router.post("/:id/payments", requireAdmin, async (req, res) => {
  try {
    const cobroId = Number(req.params.id);
    const amount = Number(req.body.amount);
    const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate).toISOString() : new Date().toISOString();
    const notes = String(req.body.notes || "").trim();

    if (!cobroId || cobroId < 1) {
      return res.status(400).json({ error: "ID de cobro inválido." });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Monto del abono inválido." });
    }

    // Verify cobro exists
    const cobro = await getCobroById(cobroId);
    if (!cobro) {
      return res.status(404).json({ error: "Cobro no encontrado." });
    }

    if (cobro.status !== "active") {
      return res.status(400).json({ error: "No se pueden agregar abonos a un cobro pagado o cancelado." });
    }

    const payment = await addPayment({ cobroId, amount, paymentDate, notes });

    return res.status(201).json({ payment });
  } catch (error) {
    console.error("[Cobros] POST /:id/payments error:", error.message);
    return res.status(500).json({ error: "Error al registrar abono." });
  }
});

// GET /api/cobros/:id/payments - Get payments for a cobro (admin only)
router.get("/:id/payments", requireAdmin, async (req, res) => {
  try {
    const cobroId = Number(req.params.id);
    if (!cobroId || cobroId < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const payments = await getPaymentsByCobroId(cobroId);
    return res.json({ payments });
  } catch (error) {
    console.error("[Cobros] GET /:id/payments error:", error.message);
    return res.status(500).json({ error: "Error al obtener abonos." });
  }
});

// PATCH /api/cobros/:id/status - Update cobro status (admin only)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const updated = await updateCobroStatus(id, status);
    if (!updated) {
      return res.status(400).json({
        error: "Estado inválido. Usa: active, paid o cancelled.",
      });
    }

    return res.json({ cobro: updated });
  } catch (error) {
    console.error("[Cobros] PATCH /:id/status error:", error.message);
    return res.status(500).json({ error: "Error al actualizar estado." });
  }
});

// DELETE /api/cobros/:id - Delete a cobro (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const deleted = await deleteCobro(id);
    if (!deleted) {
      return res.status(404).json({ error: "Cobro no encontrado." });
    }

    return res.json({ message: "Cobro eliminado correctamente." });
  } catch (error) {
    console.error("[Cobros] DELETE /:id error:", error.message);
    return res.status(500).json({ error: "Error al eliminar cobro." });
  }
});

module.exports = router;
