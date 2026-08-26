const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
  subscribe,
  unsubscribe,
  getActiveSubscribers,
  getAllSubscribers,
  getSubscriberCount,
} = require("../services/subscriptions");

// ─── Public ───────────────────────────────────────────

// POST /api/subscriptions/subscribe - Subscribe an email
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "El email es requerido." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Email inválido." });
    }

    const result = await subscribe(email.trim());

    if (result.alreadyExists) {
      return res.json({
        message: "Ya estás suscrito. ¡Gracias por confiar en nosotros!",
        alreadySubscribed: true,
      });
    }

    return res.status(201).json({
      message: result.wasReactivation
        ? "Suscripción reactivada. ¡Bienvenido de nuevo!"
        : "¡Suscripción exitosa! Pronto recibirás nuestras novedades.",
      success: true,
    });
  } catch (error) {
    console.error("[Subscriptions] Subscribe error:", error);
    return res.status(500).json({ error: "Error al suscribir. Intenta de nuevo." });
  }
});

// POST /api/subscriptions/unsubscribe - Unsubscribe
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "El email es requerido." });
    }

    await unsubscribe(email.trim());

    return res.json({
      message: "Te has dado de baja correctamente.",
      success: true,
    });
  } catch (error) {
    console.error("[Subscriptions] Unsubscribe error:", error);
    return res.status(500).json({ error: "Error al dar de baja." });
  }
});

// ─── Admin ────────────────────────────────────────────

// GET /api/subscriptions - List all subscribers (admin)
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const subscribers = await getAllSubscribers();
    return res.json({ subscribers });
  } catch (error) {
    console.error("[Subscriptions] List error:", error);
    return res.status(500).json({ error: "Error al obtener suscriptores." });
  }
});

// GET /api/subscriptions/active - List active subscribers (admin)
router.get("/active", requireAdmin, async (_req, res) => {
  try {
    const subscribers = await getActiveSubscribers();
    return res.json({ subscribers });
  } catch (error) {
    console.error("[Subscriptions] Active list error:", error);
    return res.status(500).json({ error: "Error al obtener suscriptores activos." });
  }
});

// GET /api/subscriptions/count - Subscriber count (admin)
router.get("/count", requireAdmin, async (_req, res) => {
  try {
    const count = await getSubscriberCount();
    return res.json({ count });
  } catch (error) {
    console.error("[Subscriptions] Count error:", error);
    return res.status(500).json({ error: "Error al obtener contador." });
  }
});

module.exports = router;
