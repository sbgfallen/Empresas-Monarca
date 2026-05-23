const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isCloudinaryConfigured } = require("../services/cloudinary");

let upload;

if (isCloudinaryConfigured()) {
  // Cloudinary Storage (Production)
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("cloudinary").v2;

  const cloudStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "empresas-monarca",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "avif"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });

  upload = multer({ storage: cloudStorage });
  console.log("[Upload] Using Cloudinary storage (production)");
} else {
  // Local Disk Storage (Development)
  const uploadsDir = path.join(__dirname, "..", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  });

  upload = multer({ storage: diskStorage });
  console.log("[Upload] Using local disk storage (development)");
}

module.exports = upload;