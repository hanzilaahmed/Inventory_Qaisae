import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    return errorResponse(res, `A duplicate record already exists with this unique field${target}.`, 409);
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, err.meta?.cause || 'Requested record was not found.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};
