const cloudinary = require("cloudinary").v2;

function getCloudinary() {
  const url = process.env.CLOUDINARY_URL;

  if (!url) {
    return null;
  }

  // cloudinary_url format: cloudinary://api_key:api_secret@cloud_name
  // We'll configure via env var which cloudinary auto-reads
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
  }

  return cloudinary;
}

function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET));
}

module.exports = {
  getCloudinary,
  isCloudinaryConfigured,
};
