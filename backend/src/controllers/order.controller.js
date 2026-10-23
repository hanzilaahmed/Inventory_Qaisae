import { OrderService } from '../services/order.service.js';
import { successResponse } from '../utils/response.js';

export class OrderController {
  static async create(req, res, next) {
    try {
      const order = await OrderService.createOrder(req.body);
      return successResponse(res, 'Order created successfully and stock updated', order, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const result = await OrderService.getAllOrders(req.query);
      return successResponse(res, 'Orders retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      return successResponse(res, 'Order retrieved successfully', order);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      const order = await OrderService.cancelOrder(req.params.id, reason);
      return successResponse(res, 'Order cancelled and stock restored successfully', order);
    } catch (error) {
      next(error);
    }
  }
}
