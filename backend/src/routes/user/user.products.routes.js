import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  getProductCategories,
  getProductDetail,
  getProducts,
  productPagination,
} from "../../controllers/user/productListing.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/pages/user/shop.html"));
});
router.get("/data", getProducts);
router.get("/categories", getProductCategories);
router.get("/pagination", productPagination);
router.get("/:id", getProductDetail);

export default router;
