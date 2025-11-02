import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { db } from './database/connection';

// Validate configuration on startup
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

// Initialize database
async function initializeDatabase() {
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      logger.warn('Database connection test failed, but continuing...');
    } else {
      logger.info('Database connection successful');
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    // Don't exit, continue with limited functionality
  }
}

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// Import simplified routes
import uploadRoutes from './routes/upload-simple';
import generateRoutes from './routes/generate-simple';
import dashboardRoutes from './routes/dashboard-simple';

// API routes
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/generate', generateRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'AutoDescribe RAG System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: '/api/v1/upload',
      generate: '/api/v1/generate',
      dashboard: '/api/v1/dashboard',
    },
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  await initializeDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 AutoDescribe server running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`📊 Health check: http://localhost:${config.port}/health`);
    logger.info(`🔗 API info: http://localhost:${config.port}/api/v1`);
    logger.info(`📋 Dashboard API: http://localhost:${config.port}/api/v1/dashboard`);
  });

  return server;
}

const serverPromise = startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const server = await serverPromise;
  server.close(async () => {
    await db.close();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  const server = await serverPromise;
  server.close(async () => {
    await db.close();
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;