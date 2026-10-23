import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { AuthService } from './services/auth.service.js';
import prisma from './prisma/client.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Inventory Management API',
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server immediately
const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(`  🚀 Inventory Backend API running on port ${PORT}`);
  console.log(`  🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  🔑 Default Admin: ${config.admin.email}`);
  console.log(`===================================================`);

  // Attempt database connection in background
  try {
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL Database');
    await AuthService.ensureDefaultAdmin();
  } catch (dbErr) {
    console.warn('⚠ Database connection notice:', dbErr.message);
    console.warn('  Ensure PostgreSQL (Neon / Supabase / Local) is reachable via DATABASE_URL in backend/.env');
    console.warn('  Run `npx prisma db push` to initialize tables once your database URL is set.');
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
