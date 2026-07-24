import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quickart/profile-images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) return callback(null, true);
    return callback(new Error("Only image files are allowed"));
  },
});

const profileImageUpload = (req, res, next) => {
  uploader.single("profileImage")(req, res, (error) => {
    if (!error) return next();
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Profile image must be smaller than 5 MB"
      : error.message || "Unable to upload image";
    return res.status(400).json({ message });
  });
};

export default profileImageUpload;
