import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import verifyUserToken from "../../middlewares/verifyUserToken.js";
import { addToCart, addToWishlist, getCart, removeCartItem, updateCartQuantity, validateCheckout } from "../../controllers/user/shopping.controller.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/cart", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/cart.html"));
});
router.post("/cart/items", verifyUserToken, addToCart);
router.get("/cart/items", verifyUserToken, getCart);
router.put("/cart/items/:id", verifyUserToken, updateCartQuantity);
router.delete("/cart/items/:id", verifyUserToken, removeCartItem);
router.post("/cart/validate", verifyUserToken, validateCheckout);
router.post("/wishlist/items", verifyUserToken, addToWishlist);

export default router;
