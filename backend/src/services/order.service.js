import prisma from '../prisma/client.js';
import { generateOrderNumber } from '../utils/orderNumber.js';

export class OrderService {
  /**
   * Create a new sales order, deduct inventory, and create audit log
   */
  static async createOrder(orderData) {
    const {
      customerName = 'Walk-in Customer',
      customerPhone,
      paymentMethod = 'CASH',
      discount = 0,
      tax = 0,
      notes,
      items = [],
    } = orderData;

    if (!items || items.length === 0) {
      const error = new Error('Order must contain at least one product item');
      error.statusCode = 400;
      throw error;
    }

    // Execute everything in an atomic database transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate = [];
      const stockLogsToCreate = [];

      for (const item of items) {
        const { productId, unitSold = 'PIECE', quantity = 1, customPrice } = item;

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          const error = new Error(`Invalid quantity ${quantity} for item`);
          error.statusCode = 400;
          throw error;
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          const error = new Error(`Product with ID ${productId} not found`);
          error.statusCode = 404;
          throw error;
        }

        const normalizedUnit = unitSold.toUpperCase();
        if (normalizedUnit !== 'PIECE' && normalizedUnit !== 'BOX') {
          const error = new Error(`Invalid unit ${unitSold}. Must be either PIECE or BOX.`);
          error.statusCode = 400;
          throw error;
        }

        // Validate selling unit configuration
        if (normalizedUnit === 'BOX' && product.sellingUnitType === 'PIECE_ONLY') {
          const error = new Error(`Product "${product.name}" is configured for Piece sales only`);
          error.statusCode = 400;
          throw error;
        }

        if (normalizedUnit === 'PIECE' && product.sellingUnitType === 'BOX_ONLY') {
          const error = new Error(`Product "${product.name}" is configured for Box sales only`);
          error.statusCode = 400;
          throw error;
        }

        // Calculate pieces deduction
        const piecesPerBox = product.piecesPerBox > 0 ? product.piecesPerBox : 1;
        const piecesToDeduct = normalizedUnit === 'BOX' ? qty * piecesPerBox : qty;

        // Check stock availability
        if (product.stockPieces < piecesToDeduct) {
          const error = new Error(
            `Insufficient stock for "${product.name}". Required: ${piecesToDeduct} pcs (${qty} ${normalizedUnit.toLowerCase()}${qty > 1 ? 's' : ''}), Available: ${product.stockPieces} pcs.`
          );
          error.statusCode = 400;
          throw error;
        }

        // Determine price
        let unitPrice = 0;
        if (customPrice !== undefined && customPrice !== null && !isNaN(customPrice)) {
          unitPrice = parseFloat(customPrice);
        } else {
          unitPrice = normalizedUnit === 'BOX' ? product.pricePerBox : product.pricePerPiece;
        }

        const itemTotal = Number((qty * unitPrice).toFixed(2));
        subtotal += itemTotal;

        const newStockPieces = product.stockPieces - piecesToDeduct;

        // Deduct inventory
        await tx.product.update({
          where: { id: productId },
          data: { stockPieces: newStockPieces },
        });

        orderItemsToCreate.push({
          productId: product.id,
          productName: product.name,
          unitSold: normalizedUnit,
          quantity: qty,
          piecesPerBox,
          piecesDeducted: piecesToDeduct,
          unitPrice,
          totalPrice: itemTotal,
        });

        stockLogsToCreate.push({
          productId: product.id,
          type: 'SALE',
          quantityChanged: -piecesToDeduct,
          stockBefore: product.stockPieces,
          stockAfter: newStockPieces,
          notes: `Sold ${qty} ${normalizedUnit.toLowerCase()}${qty > 1 ? 's' : ''} (${piecesToDeduct} pcs total)`,
        });
      }

      const parsedDiscount = parseFloat(discount) || 0;
      const parsedTax = parseFloat(tax) || 0;
      const totalAmount = Number((subtotal - parsedDiscount + parsedTax).toFixed(2));

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: customerName.trim(),
          customerPhone: customerPhone ? customerPhone.trim() : null,
          subtotal: Number(subtotal.toFixed(2)),
          discount: parsedDiscount,
          tax: parsedTax,
          totalAmount: Math.max(0, totalAmount),
          paymentMethod,
          status: 'COMPLETED',
          notes: notes ? notes.trim() : null,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // Create Stock Logs linked to this order
      for (const log of stockLogsToCreate) {
        await tx.stockLog.create({
          data: {
            ...log,
            orderId: order.id,
            notes: `${log.notes} for Order ${order.orderNumber}`,
          },
        });
      }

      return order;
    });

    return createdOrder;
  }

  static async getAllOrders({ page = 1, limit = 20, search, status, paymentMethod, startDate, endDate } = {}) {
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {};

    if (search && search !== 'undefined') {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'undefined') {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== 'undefined') {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  sellingUnitType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async getOrderById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        stockLogs: true,
      },
    });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    return order;
  }

  static async cancelOrder(id, reason = 'Order cancelled by admin') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.status === 'CANCELLED') {
      const error = new Error('Order is already cancelled');
      error.statusCode = 400;
      throw error;
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for all items
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const restoredStock = product.stockPieces + item.piecesDeducted;
          await tx.product.update({
            where: { id: item.productId },
            data: { stockPieces: restoredStock },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              orderId: order.id,
              type: 'RETURN',
              quantityChanged: item.piecesDeducted,
              stockBefore: product.stockPieces,
              stockAfter: restoredStock,
              notes: `Order ${order.orderNumber} cancelled. Restored ${item.quantity} ${item.unitSold.toLowerCase()}(s) (${item.piecesDeducted} pcs). Reason: ${reason}`,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: order.notes ? `${order.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
        },
        include: { items: true },
      });

      return updated;
    });

    return cancelledOrder;
  }
}
