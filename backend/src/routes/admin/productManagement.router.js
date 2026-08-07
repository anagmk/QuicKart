import express from 'express';
import path from "path";
import { fileURLToPath } from "url";
const router = express.Router();
import { getAllProducts, getProductById, addProduct, editProduct, deleteProduct, addVariant, deleteVariant, searchProductsByName, blockProduct } from '../../controllers/admin/product.js';
import productImageUpload from "../../middlewares/productImageUpload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const page = (file) => (_req, res) => res.sendFile(path.join(__dirname, `../../../../frontend/pages/admin/${file}`));

router.get('/products', page('products.html'));
router.get('/products/add', page('products_edite.html'));
router.get('/products/edit/:id', page('products_edite.html'));
router.get('/products/:id/variants', page('varients.html'));

router.get('/products/all', getAllProducts);
router.get('/products/search', searchProductsByName);
router.post('/products/add', addProduct);
router.put('/products/:id/block', blockProduct);
router.post('/products/:id/variants', productImageUpload, addVariant);
router.delete('/products/:id/variants/:variantId', deleteVariant);
router.get('/products/:id', getProductById);
router.put('/products/:id', editProduct);
router.delete('/products/:id', deleteProduct);

export default router;
