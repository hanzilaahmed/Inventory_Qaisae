import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all order/sales routes with admin auth
router.use(authenticateAdmin);

router.post('/', OrderController.create);
router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/:id/cancel', OrderController.cancel);

export default router;
