import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return successResponse(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const admin = await AuthService.getProfile(req.admin.id);
      return successResponse(res, 'Profile retrieved', admin);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const updated = await AuthService.updateProfile(req.admin.id, req.body);
      return successResponse(res, 'Profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }
}
