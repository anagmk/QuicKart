import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { adminLogin } from "../../controllers/auth/adminAuth.controller.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/login", (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/admin/admin-login.html"),
  );
});

router.get("/dashboard", (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/admin/dashboard.html"),
  );
});

router.post("/login", adminLogin);

export default router;
