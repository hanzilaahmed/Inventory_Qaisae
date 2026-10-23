import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller.js';
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all history & dashboard routes with admin auth
router.use(authenticateAdmin);

router.get('/stock-logs', HistoryController.getStockLogs);
router.get('/dashboard-metrics', HistoryController.getDashboardMetrics);

export default router;
