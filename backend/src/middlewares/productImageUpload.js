import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "quickart/product-variants", resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp"] },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, done) => file.mimetype.startsWith("image/") ? done(null, true) : done(new Error("Only JPG, PNG, and WebP images are allowed")),
});

export default (req, res, next) => upload.array("images", 3)(req, res, (error) => {
  if (!error) return next();
  return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each image must be smaller than 5 MB" : error.message || "Unable to upload images" });
});
