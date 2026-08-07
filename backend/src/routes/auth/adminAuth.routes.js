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

["orders", "sales-report", "coupons", "returns", "banners", "referrals", "offers"].forEach((section) => {
  router.get(`/${section}`, (_req, res) => res.redirect("/admin/dashboard"));
});

router.get("/logout", (_req, res) => {
  res.clearCookie("adminToken");
  res.redirect("/admin/login");
});

router.post("/login", adminLogin);

export default router;
