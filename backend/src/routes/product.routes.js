import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all product routes with admin auth
router.use(authenticateAdmin);

router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getById);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.post('/:id/adjust-stock', ProductController.adjustStock);
router.delete('/:id', ProductController.delete);

export default router;
