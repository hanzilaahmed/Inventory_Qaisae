import { HistoryService } from '../services/history.service.js';
import { successResponse } from '../utils/response.js';

export class HistoryController {
  static async getStockLogs(req, res, next) {
    try {
      const result = await HistoryService.getStockLogs(req.query);
      return successResponse(res, 'Stock logs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await HistoryService.getDashboardMetrics();
      return successResponse(res, 'Dashboard metrics retrieved successfully', metrics);
    } catch (error) {
      next(error);
    }
  }
}
