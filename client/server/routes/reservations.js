const express = require("express");
const { validate } = require("../middleware/validate");
const { requireSession } = require("../middleware/sessionAuth");
const { audit } = require("../services/audit");
const reservations = require("../services/reservations");
const { reservationCreateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", requireSession, async (req, res) => {
  try {
    const { status, date, limit, offset } = req.query;
    return res.json(await reservations.getReservations({ status, date, limit: limit ? parseInt(limit) : 50, offset: offset ? parseInt(offset) : 0 }));
  } catch (error) { console.error("[Reservations] List error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.get("/stats", requireSession, async (req, res) => {
  try { return res.json(await reservations.getReservationStats()); }
  catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.post("/", validate(reservationCreateSchema), async (req, res) => {
  try {
    const reservation = await reservations.createReservation(req.body);
    await audit(null, "CREAR", "Reservation", reservation.id, { name: reservation.name, date: reservation.date }, req.ip);
    return res.json(reservation);
  } catch (error) { console.error("[Reservations] Create error:", error.message); return res.status(500).json({ error: "Error del servidor" }); }
});

router.patch("/:id/status", requireSession, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Estado inválido" });
    const reservation = await reservations.updateReservationStatus(parseInt(req.params.id), status);
    if (!reservation) return res.status(404).json({ error: "Reservación no encontrada" });
    await audit(req.user, "EDITAR", "Reservation", reservation.id, { newStatus: status }, req.ip);
    return res.json(reservation);
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.delete("/:id", requireSession, async (req, res) => {
  try {
    await reservations.deleteReservation(parseInt(req.params.id));
    await audit(req.user, "ELIMINAR", "Reservation", parseInt(req.params.id), null, req.ip);
    return res.json({ success: true });
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

module.exports = router;
