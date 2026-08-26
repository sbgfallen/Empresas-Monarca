const express = require("express");

const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const {
  getAllCredits,
  getCreditById,
  createCredit,
  updateCreditStatus,
  countByStatus,
} = require("../services/credits");
const { sendCreditApprovedEmail } = require("../services/email");
const { getSetting } = require("../services/settings");

function parseNumeric(value, fallback = 0) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// POST /api/credits - Submit a new credit application (public)
router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const amount = parseNumeric(req.body.amount);
    // Payment modality: "daily" | "weekly" | "monthly"
    const paymentPlan = String(req.body.paymentPlan || "monthly").trim().toLowerCase();

    if (!name || !email || !phone) {
      return res.status(400).json({
        error: "Nombre, correo y teléfono son requeridos.",
      });
    }

    if (amount < 10000) {
      return res.status(400).json({
        error: "El monto mínimo es de $10,000 ARS.",
      });
    }

    if (amount > 1000000) {
      return res.status(400).json({
        error: "El monto máximo es de $1,000,000 ARS.",
      });
    }

    // Calculate based on payment plan (same rates as FeaturedProducts)
    const rates = {
      daily: 1.60,
      weekly: 1.60,
      monthly: 1.60,
    };

    const divisors = {
      daily: 30,
      weekly: 4,
      monthly: 1,
    };

    const multiplier = rates[paymentPlan] || rates.monthly;
    const divisor = divisors[paymentPlan] || divisors.monthly;

    const totalPayment = amount * multiplier;
    const installment = totalPayment / divisor;

    const termLabels = {
      daily: "30 días",
      weekly: "4 cuotas",
      monthly: "1 cuota",
    };

    const credit = await createCredit({
      name,
      email,
      phone,
      amount,
      termMonths: divisor,
      interestRate: Math.round((multiplier - 1) * 100),
      monthlyPayment: Math.round(installment),
      totalPayment: Math.round(totalPayment),
    });

    return res.status(201).json({
      credit,
      paymentPlan: {
        type: paymentPlan,
        label: termLabels[paymentPlan],
        installment: Math.round(installment),
        total: Math.round(totalPayment),
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Error al procesar la solicitud de crédito.",
    });
  }
});

// GET /api/credits - List all credits (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const credits = await getAllCredits(statusFilter || undefined);
    const counts = await countByStatus();

    return res.json({
      credits,
      counts,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Error al obtener solicitudes de crédito.",
    });
  }
});

// GET /api/credits/:id - Get single credit (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const credit = await getCreditById(id);

    if (!credit) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    return res.json({ credit });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Error al obtener la solicitud.",
    });
  }
});

// PATCH /api/credits/:id/status - Update credit status (admin only)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    const notes = String(req.body.notes || "").trim();

    if (!id || id < 1) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const updated = await updateCreditStatus(id, status, notes);

    if (!updated) {
      return res.status(400).json({
        error: "Estado inválido. Usa: pending, approved, rejected o paid.",
      });
    }

    // Auto-send approval email when credit is approved
    if (status === "approved") {
      const credit = await getCreditById(id);

      if (credit) {
        // Infer payment plan from term_months
        const termMonths = Number(credit.term_months);
        let paymentPlan = "monthly";
        if (termMonths === 30) paymentPlan = "daily";
        else if (termMonths === 4) paymentPlan = "weekly";

        // Fetch whatsapp number from settings
        const whatsappNumber = await getSetting("whatsapp_number").catch(() => "5491130000000");

        // Fire and forget — don't block the response
        sendCreditApprovedEmail({
          to: credit.email,
          name: credit.name,
          amount: Number(credit.amount),
          termMonths,
          interestRate: Number(credit.interest_rate),
          monthlyPayment: Number(credit.monthly_payment),
          totalPayment: Number(credit.total_payment),
          paymentPlan,
          whatsappNumber: whatsappNumber || "5491130000000",
        }).catch((err) => {
          console.log(`Failed to send approval email for credit #${id}:`, err.message);
        });
      }
    }

    return res.json({ credit: updated });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Error al actualizar el estado.",
    });
  }
});

module.exports = router;
