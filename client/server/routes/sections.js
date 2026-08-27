const express = require("express");
const { validate } = require("../middleware/validate");
const { requireSession, requireRoles } = require("../middleware/sessionAuth");
const { audit } = require("../services/audit");
const sections = require("../services/sections");
const { sectionCreateSchema, sectionUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", async (req, res) => {
  try { return res.json(await sections.listSections({ publicOnly: !req.user })); }
  catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.get("/types", (req, res) => res.json(sections.SECTION_TYPES));

router.get("/:id", async (req, res) => {
  try {
    const section = await sections.getSectionById(parseInt(req.params.id));
    if (!section) return res.status(404).json({ error: "Sección no encontrada" });
    return res.json(section);
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.post("/", requireSession, validate(sectionCreateSchema), async (req, res) => {
  try {
    const section = await sections.createSection(req.body);
    await audit(req.user, "CREAR", "HomepageSection", section.id, { type: section.type }, req.ip);
    return res.json(section);
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.put("/:id", requireSession, validate(sectionUpdateSchema), async (req, res) => {
  try {
    const section = await sections.updateSection(parseInt(req.params.id), req.body);
    if (!section) return res.status(404).json({ error: "Sección no encontrada" });
    await audit(req.user, "EDITAR", "HomepageSection", section.id, { fields: Object.keys(req.body) }, req.ip);
    return res.json(section);
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

router.delete("/:id", requireSession, requireRoles(["owner", "super_admin"]), async (req, res) => {
  try {
    await sections.deleteSection(parseInt(req.params.id));
    await audit(req.user, "ELIMINAR", "HomepageSection", parseInt(req.params.id), null, req.ip);
    return res.json({ success: true });
  } catch (error) { return res.status(500).json({ error: "Error del servidor" }); }
});

module.exports = router;
