import express from 'express'
import path from "path";
import { fileURLToPath } from "url";
const router = express.Router();
import {addCategory, getAllCategories, getCategoryById, editCategory, deleteCategory,searchCategoriesByName,paginateCategories,sortCategories} from '../../controllers/admin/category.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/category', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../../../frontend/pages/admin/category.html'));
});

router.get('/category/edit/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../../../frontend/pages/admin/category_edite.html'));
});

router.get('/category/add', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../../../frontend/pages/admin/category_edite.html'));
});

router.post('/category/add', addCategory);
router.get('/category/all',getAllCategories);
router.get('/category/search', searchCategoriesByName);
router.get('/category/paginated', paginateCategories);
router.get('/category/sort', sortCategories);
router.get('/category/:id', getCategoryById);
router.put('/category/:id',editCategory);
router.delete('/category/:id',deleteCategory);


export default router;
