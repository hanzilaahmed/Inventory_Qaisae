import bcrypt from 'bcryptjs';
import prisma from '../src/prisma/client.js';
import { config } from '../src/config/env.js';

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed or update single Admin
  const hashedPassword = await bcrypt.hash(config.admin.password, 10);
  const admin = await prisma.admin.upsert({
    where: { email: config.admin.email },
    update: { password: hashedPassword },
    create: {
      name: config.admin.name,
      email: config.admin.email,
      password: hashedPassword,
    },
  });
  console.log(`✓ Admin confirmed: ${admin.email}`);

  // 2. Check if products already exist
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log(`✓ Database already has ${productCount} products. Skipping sample product creation.`);
    return;
  }

  console.log('Seeding demo products with Piece & Box selling options...');

  const sampleProducts = [
    {
      name: 'Premium Gel Pens (Box of 12)',
      sku: 'PEN-GEL-01',
      category: 'Stationery',
      description: 'Smooth writing 0.7mm gel ink pens. Can be sold individually or by the box.',
      sellingUnitType: 'BOTH', // Can be sold as piece or box
      piecesPerBox: 12,
      pricePerPiece: 1.5,
      pricePerBox: 15.0, // Discounted bulk box price
      costPrice: 8.0,
      stockPieces: 120, // 10 boxes = 120 pieces
      minStockAlert: 24,
    },
    {
      name: 'A4 Double A Copy Paper 80gsm',
      sku: 'PPR-A4-500',
      category: 'Paper Supplies',
      description: 'Premium paper ream. 5 reams per wholesale carton/box.',
      sellingUnitType: 'BOTH',
      piecesPerBox: 5,
      pricePerPiece: 6.5,
      pricePerBox: 30.0,
      costPrice: 20.0,
      stockPieces: 50, // 10 boxes = 50 reams
      minStockAlert: 10,
    },
    {
      name: 'Wireless Ergonomic Mouse',
      sku: 'TECH-MSE-W1',
      category: 'Electronics',
      description: 'High precision optical mouse, sold individually.',
      sellingUnitType: 'PIECE_ONLY', // Only sold per piece
      piecesPerBox: 1,
      pricePerPiece: 22.0,
      pricePerBox: 22.0,
      costPrice: 12.0,
      stockPieces: 35,
      minStockAlert: 5,
    },
    {
      name: 'Energy Drink 250ml Wholesale Pack',
      sku: 'BEV-ENG-24',
      category: 'Beverages',
      description: '24-can wholesale case. Only sold as full master cases/boxes.',
      sellingUnitType: 'BOX_ONLY', // Only sold per box
      piecesPerBox: 24,
      pricePerPiece: 2.0,
      pricePerBox: 40.0,
      costPrice: 28.0,
      stockPieces: 192, // 8 boxes * 24 = 192 cans
      minStockAlert: 48,
    },
    {
      name: 'USB-C Fast Charging Cable (1m)',
      sku: 'TECH-CBL-C1',
      category: 'Electronics',
      description: 'Braided nylon USB-C fast charging cable. Available in 10-pack boxes or single.',
      sellingUnitType: 'BOTH',
      piecesPerBox: 10,
      pricePerPiece: 5.0,
      pricePerBox: 42.0,
      costPrice: 25.0,
      stockPieces: 85, // 8 boxes and 5 loose pieces
      minStockAlert: 15,
    },
  ];

  for (const prod of sampleProducts) {
    const created = await prisma.product.create({
      data: prod,
    });

    await prisma.stockLog.create({
      data: {
        productId: created.id,
        type: 'INITIAL',
        quantityChanged: created.stockPieces,
        stockBefore: 0,
        stockAfter: created.stockPieces,
        notes: `Initial stock setup: ${created.stockPieces} pieces (${Math.floor(created.stockPieces / created.piecesPerBox)} boxes)`,
      },
    });

    console.log(`✓ Created product: ${created.name} (${created.sellingUnitType})`);
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
