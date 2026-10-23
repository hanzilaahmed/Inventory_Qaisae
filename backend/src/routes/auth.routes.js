import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateAdmin, AuthController.getMe);
router.put('/me', authenticateAdmin, AuthController.updateMe);

export default router;
