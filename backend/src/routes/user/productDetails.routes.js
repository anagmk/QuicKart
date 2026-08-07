import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getProductDetail } from "../../controllers/user/productListing.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get("/product/:id", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/product_deailsPage.html"));
});
router.get("/product/:id/data", getProductDetail);

export default router;
