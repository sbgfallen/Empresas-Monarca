const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getAllImages,
  getImageById,
  getImagesByCategory,
  createImage,
  updateImage,
  deleteImage,
} = require("../services/images");

// ─── Upload image ─────────────────────────────────────

router.post("/upload", requireAdmin, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("[Images] Upload error:", err);
      return res.status(400).json({ error: err.message || "Error al subir imagen." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo." });
    }

    try {
      const { originalname, filename, size, mimetype } = req.file;

      // Cloudinary returns full URL in req.file.path
      // Local disk: construct URL from server origin
      const url =
        req.file.path ||
        `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;

      const alt = req.body.alt || originalname.replace(/\.[^.]+$/, "");
      const category = req.body.category || "general";

      const image = await createImage({
        filename,
        originalName: originalname,
        url,
        alt,
        category,
        fileSize: size,
        width: 0,
        height: 0,
      });

      return res.status(201).json({ image });
    } catch (error) {
      console.error("[Images] DB error:", error);
      return res.status(500).json({ error: "Error al guardar imagen." });
    }
  });
});

// ─── Public ───────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let images;
    if (category) {
      images = await getImagesByCategory(category);
    } else {
      images = await getAllImages();
    }
    return res.json({ images });
  } catch (error) {
    console.error("[Images] List error:", error);
    return res.status(500).json({ error: "Error al obtener imágenes." });
  }
});

// ─── Admin ────────────────────────────────────────────

router.get("/all", requireAdmin, async (_req, res) => {
  try {
    const images = await getAllImages();
    return res.json({ images });
  } catch (error) {
    console.error("[Images] Admin list error:", error);
    return res.status(500).json({ error: "Error al obtener imágenes." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });
    const image = await getImageById(id);
    if (!image) return res.status(404).json({ error: "Imagen no encontrada." });
    return res.json({ image });
  } catch (error) {
    console.error("[Images] Get error:", error);
    return res.status(500).json({ error: "Error al obtener imagen." });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });

    const updated = await updateImage(id, req.body);
    if (!updated) return res.status(404).json({ error: "Imagen no encontrada." });
    return res.json({ image: updated });
  } catch (error) {
    console.error("[Images] Update error:", error);
    return res.status(500).json({ error: "Error al actualizar imagen." });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: "ID inválido." });

    const image = await getImageById(id);
    if (!image) return res.status(404).json({ error: "Imagen no encontrada." });

    // Try to delete from Cloudinary if configured
    const { getCloudinary, isCloudinaryConfigured } = require("../services/cloudinary");
    if (isCloudinaryConfigured()) {
      const cloudinary = getCloudinary();
      if (cloudinary && image.url && image.url.includes("cloudinary")) {
        // Extract public_id from Cloudinary URL
        const urlParts = image.url.split("/");
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = "empresas-monarca/" + publicIdWithExt.replace(/\.[^.]+$/, "");
        cloudinary.uploader.destroy(publicId).catch((err) =>
          console.log("[Images] Cloudinary delete failed:", err.message)
        );
      }
    } else {
      // Delete file from disk
      const filePath = path.join(__dirname, "..", "uploads", image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await deleteImage(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Images] Delete error:", error);
    return res.status(500).json({ error: "Error al eliminar imagen." });
  }
});

module.exports = router;
