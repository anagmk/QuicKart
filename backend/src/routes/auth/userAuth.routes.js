import express from "express";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import {
  signup,
  login,
  verifyOtp,
  resentOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  logout,
  googleCallback
} from "../../controllers/auth/userAuth.controller.js";
import verifyUserToken from "../../middlewares/verifyUserToken.js";

import passport from "passport";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return next();
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect("/user/home");
  } catch {
    return next();
  }
};

router.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

router.get("/signup", redirectIfAuthenticated, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/auth/signup.html"),
  );
});
router.post("/signup", signup);

router.get("/login", redirectIfAuthenticated, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/auth/login.html"),
  );
});
router.post("/login", login);
router.get("/verify-otp", redirectIfAuthenticated, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/auth/otp-verify.html"),
  );
});
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resentOtp);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.get("/forgot-password", redirectIfAuthenticated, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/pages/auth/forgot-password.html"),
  );
});
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  googleCallback,
);

router.get("/home", verifyUserToken, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/auth/home.html"),
  );
});

export default router;
