import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import prisma from '../prisma/client.js';
import { errorResponse } from '../utils/response.js';

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authorization token required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true },
    });

    if (!admin) {
      return errorResponse(res, 'Admin account not found or access revoked.', 401);
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Invalid or expired token. Please log in again.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 500);
  }
};
