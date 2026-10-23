import { ProductService } from '../services/product.service.js';
import { successResponse } from '../utils/response.js';

export class ProductController {
  static async getAll(req, res, next) {
    try {
      const result = await ProductService.getAllProducts(req.query);
      return successResponse(res, 'Products fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return successResponse(res, 'Product fetched successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body);
      return successResponse(res, 'Product created successfully', product, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      return successResponse(res, 'Product updated successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req, res, next) {
    try {
      const product = await ProductService.adjustStock(req.params.id, req.body);
      return successResponse(res, 'Stock adjusted successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      return successResponse(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req, res, next) {
    try {
      const categories = await ProductService.getCategories();
      return successResponse(res, 'Categories fetched successfully', categories);
    } catch (error) {
      next(error);
    }
  }
}
