import prisma from '../prisma/client.js';

export class HistoryService {
  /**
   * Get audit log history of stock movements
   */
  static async getStockLogs({ productId, type, page = 1, limit = 50 } = {}) {
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {};
    if (productId && productId !== 'undefined') where.productId = productId;
    if (type && type !== 'undefined') where.type = type;

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingUnitType: true,
              piecesPerBox: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.stockLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Aggregated dashboard analytics
   */
  static async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      products,
      totalOrders,
      todayOrders,
      allCompletedOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          stockPieces: true,
          minStockAlert: true,
          piecesPerBox: true,
          sellingUnitType: true,
          pricePerPiece: true,
          pricePerBox: true,
        },
      }),
      prisma.order.count(),
      prisma.order.findMany({
        where: {
          createdAt: { gte: todayStart },
          status: 'COMPLETED',
        },
      }),
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
    ]);

    // Calculate low stock products
    const lowStockProducts = products.filter((p) => p.stockPieces <= p.minStockAlert);

    // Calculate total revenue & today revenue
    const totalRevenue = allCompletedOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);
    const todayRevenue = todayOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, p) => {
      // estimated retail value based on piece price
      return sum + p.stockPieces * p.pricePerPiece;
    }, 0);

    return {
      overview: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalOrders,
        todayOrdersCount: todayOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        todayRevenue: Number(todayRevenue.toFixed(2)),
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      },
      lowStockProducts: lowStockProducts.slice(0, 10),
      recentOrders,
    };
  }
}
