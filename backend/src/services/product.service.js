import prisma from '../prisma/client.js';

export class ProductService {
  /**
   * Helper to append computed unit display attributes
   */
  static formatProduct(product) {
    if (!product) return null;
    const piecesPerBox = product.piecesPerBox > 0 ? product.piecesPerBox : 1;
    const totalBoxes = Math.floor(product.stockPieces / piecesPerBox);
    const loosePieces = product.stockPieces % piecesPerBox;

    let displayStock = '';
    if (product.sellingUnitType === 'BOX_ONLY') {
      displayStock = `${totalBoxes} Box${totalBoxes === 1 ? '' : 'es'} (${product.stockPieces} pcs)`;
    } else if (product.sellingUnitType === 'PIECE_ONLY') {
      displayStock = `${product.stockPieces} Piece${product.stockPieces === 1 ? '' : 's'}`;
    } else {
      displayStock = `${totalBoxes} Box${totalBoxes === 1 ? '' : 'es'}, ${loosePieces} Piece${loosePieces === 1 ? '' : 's'} (${product.stockPieces} total pcs)`;
    }

    return {
      ...product,
      totalBoxes,
      loosePieces,
      displayStock,
      isLowStock: product.stockPieces <= product.minStockAlert,
    };
  }

  static async getAllProducts({ search, category, lowStock, limit = 100, page = 1 } = {}) {
    const where = {};

    if (search && search !== 'undefined') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'undefined') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (lowStock === 'true' || lowStock === true) {
      // Prisma raw comparison or filter
      // In prisma, we can filter where stockPieces <= minStockAlert with raw or filter in memory if needed
      // Or we can query all and filter, or use Prisma syntax:
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

    let formatted = products.map((p) => this.formatProduct(p));
    if (lowStock === 'true' || lowStock === true) {
      formatted = formatted.filter((p) => p.isLowStock);
    }

    return {
      products: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatProduct(product);
  }

  static async createProduct(data) {
    const {
      name,
      sku,
      category,
      description,
      sellingUnitType = 'BOTH', // 'PIECE_ONLY', 'BOX_ONLY', 'BOTH'
      piecesPerBox = 1,
      pricePerPiece = 0,
      pricePerBox = 0,
      costPrice = 0,
      initialStock = 0, // initial stock in either pieces or initial boxes
      stockUnitInput = 'PIECE', // 'PIECE' or 'BOX'
      minStockAlert = 10,
      minStockAlertUnit = 'PIECE', // 'PIECE' or 'BOX'
    } = data;

    if (!name || !sku) {
      const error = new Error('Product name and SKU are required');
      error.statusCode = 400;
      throw error;
    }

    const parsedPiecesPerBox = Math.max(1, parseInt(piecesPerBox, 10) || 1);

    // Calculate total base pieces
    let totalPieces = 0;
    const parsedInitialStock = Math.max(0, parseInt(initialStock, 10) || 0);

    if (stockUnitInput === 'BOX') {
      totalPieces = parsedInitialStock * parsedPiecesPerBox;
    } else {
      totalPieces = parsedInitialStock;
    }

    // Auto-calculate box price or piece price if only one provided
    let calculatedPiecePrice = parseFloat(pricePerPiece) || 0;
    let calculatedBoxPrice = parseFloat(pricePerBox) || 0;

    if (sellingUnitType === 'BOX_ONLY' && calculatedBoxPrice > 0 && calculatedPiecePrice === 0) {
      calculatedPiecePrice = Number((calculatedBoxPrice / parsedPiecesPerBox).toFixed(2));
    } else if (sellingUnitType === 'PIECE_ONLY' && calculatedPiecePrice > 0 && calculatedBoxPrice === 0) {
      calculatedBoxPrice = Number((calculatedPiecePrice * parsedPiecesPerBox).toFixed(2));
    }

    const rawAlert = parseInt(minStockAlert, 10) || 10;
    const computedAlertPieces = minStockAlertUnit === 'BOX' ? rawAlert * parsedPiecesPerBox : rawAlert;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category ? category.trim() : null,
          description: description ? description.trim() : null,
          sellingUnitType,
          piecesPerBox: parsedPiecesPerBox,
          pricePerPiece: calculatedPiecePrice,
          pricePerBox: calculatedBoxPrice,
          costPrice: parseFloat(costPrice) || 0,
          stockPieces: totalPieces,
          minStockAlert: computedAlertPieces,
        },
      });

      // Log initial stock creation
      if (totalPieces > 0) {
        await tx.stockLog.create({
          data: {
            productId: product.id,
            type: 'INITIAL',
            quantityChanged: totalPieces,
            stockBefore: 0,
            stockAfter: totalPieces,
            notes: `Initial stock added: ${totalPieces} pieces (${Math.floor(totalPieces / parsedPiecesPerBox)} boxes, ${totalPieces % parsedPiecesPerBox} pcs)`,
          },
        });
      }

      return product;
    });

    return this.formatProduct(result);
  }

  static async updateProduct(id, data) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.sku !== undefined) updateData.sku = data.sku.trim().toUpperCase();
    if (data.category !== undefined) updateData.category = data.category ? data.category.trim() : null;
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.sellingUnitType !== undefined) updateData.sellingUnitType = data.sellingUnitType;
    if (data.piecesPerBox !== undefined) updateData.piecesPerBox = Math.max(1, parseInt(data.piecesPerBox, 10));
    if (data.pricePerPiece !== undefined) updateData.pricePerPiece = parseFloat(data.pricePerPiece);
    if (data.pricePerBox !== undefined) updateData.pricePerBox = parseFloat(data.pricePerBox);
    if (data.minStockAlert !== undefined) {
      const ppb = updateData.piecesPerBox || existing.piecesPerBox || 1;
      const alertMultiplier = data.minStockAlertUnit === 'BOX' ? ppb : 1;
      updateData.minStockAlert = (parseInt(data.minStockAlert, 10) || 10) * alertMultiplier;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return this.formatProduct(updated);
  }

  static async adjustStock(id, { quantity, unit = 'PIECE', type = 'ADJUSTMENT', notes = '' }) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      const error = new Error('Valid non-zero quantity is required');
      error.statusCode = 400;
      throw error;
    }

    const multiplier = unit === 'BOX' ? product.piecesPerBox : 1;
    const piecesDelta = qty * multiplier;
    const newStockPieces = product.stockPieces + piecesDelta;

    if (newStockPieces < 0) {
      const error = new Error(`Insufficient stock. Current stock is ${product.stockPieces} pieces.`);
      error.statusCode = 400;
      throw error;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { stockPieces: newStockPieces },
      });

      await tx.stockLog.create({
        data: {
          productId: id,
          type: type || (piecesDelta > 0 ? 'RESTOCK' : 'ADJUSTMENT'),
          quantityChanged: piecesDelta,
          stockBefore: product.stockPieces,
          stockAfter: newStockPieces,
          notes: notes || `Stock manually adjusted by ${piecesDelta > 0 ? '+' : ''}${qty} ${unit}s (${piecesDelta} pcs)`,
        },
      });

      return updated;
    });

    return this.formatProduct(result);
  }

  static async deleteProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: { take: 1 } },
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (product.orderItems.length > 0) {
      const error = new Error('Cannot delete product with existing sales history. You can adjust stock to 0 instead.');
      error.statusCode = 400;
      throw error;
    }

    await prisma.product.delete({ where: { id } });
    return { id, message: 'Product deleted successfully' };
  }

  static async getCategories() {
    const categories = await prisma.product.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return categories.map((c) => c.category).filter(Boolean);
  }
}
