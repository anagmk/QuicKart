import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  requestEmailChange,
  resendEmailChangeOtp,
  verifyEmailChangeOtp,
  requestPhoneChange,
  resendPhoneChangeOtp,
  verifyPhoneChangeOtp,
} from "../../controllers/user/userPorfile.js";
import verifyUserToken from "../../middlewares/verifyUserToken.js";
import profileImageUpload from "../../middlewares/profileImageUpload.js";
import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  updateAddress,
} from "../../controllers/user/address.controller.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep the browser URL as a page route. Profile data is loaded separately by
// the page script so navigating here does not render the API JSON response.
router.get("/profile", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/profile.html"));
});
router.get("/profile/data", verifyUserToken, getProfile);
router.put("/profile", verifyUserToken, updateProfile);
router.post(
  "/profile/image",
  verifyUserToken,
  profileImageUpload,
  uploadProfileImage,
);

router.get("/logout", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/logout.html"));
});

router.get("/address", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/address.html"));
});
router.get("/address/edit", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/edite-address.html"));
});
router.get("/addresses", verifyUserToken, listAddresses);
router.post("/addresses", verifyUserToken, createAddress);
router.get("/addresses/:id", verifyUserToken, getAddress);
router.put("/addresses/:id", verifyUserToken, updateAddress);
router.delete("/addresses/:id", verifyUserToken, deleteAddress);

router.get("/change-email", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/changeEmail.html"));
});
router.post("/change-email/request", verifyUserToken, requestEmailChange);
router.post("/change-email/resend", verifyUserToken, resendEmailChangeOtp);
router.post("/change-email/verify", verifyUserToken, verifyEmailChangeOtp);
router.get("/change-email/verify", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/auth/otp-verify.html"));
});
router.post("/change-phone/request", verifyUserToken, requestPhoneChange);
router.post("/change-phone/resend", verifyUserToken, resendPhoneChangeOtp);
router.post("/change-phone/verify", verifyUserToken, verifyPhoneChangeOtp);
router.get("/change-phone/verify", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/auth/otp-verify.html"));
});

router.get("/change-password", verifyUserToken, (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/change-password.html"));
});
router.post("/change-password", verifyUserToken, changePassword);

export default router;
