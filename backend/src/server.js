/**
 * @module server
 * @description EduSmart Express server entry point.
 * Configures middleware, mounts route namespaces, and starts the HTTP server.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// ─── Route Imports ────────────────────────────────────────────────────────────
// These stubs will be filled in by their respective route files.
// Import them conditionally so the server boots even if route files don't exist yet.

const importRoute = async (path) => {
  try {
    const module = await import(path);
    return module.default;
  } catch {
    const stub = express.Router();
    stub.all('*', (req, res) =>
      res.status(501).json({ success: false, message: `Route '${path}' not yet implemented.` })
    );
    return stub;
  }
};

// ─── App Initialization ───────────────────────────────────────────────────────

const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────────────

const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Logger ──────────────────────────────────────────────────────────────

if (config.NODE_ENV !== 'test') {
  app.use(
    morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined')
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    version: '1.0.0',
  });
});

// ─── Route Mounting (async bootstrap) ────────────────────────────────────────

const bootstrap = async () => {
  // Connect to MongoDB
  await connectDB();

  // Dynamically import routes (gracefully falls back to 501 stub if not yet created)
  const [authRoutes, courseRoutes, quizRoutes, dashboardRoutes, adminRoutes] =
    await Promise.all([
      importRoute('./routes/auth.routes.js'),
      importRoute('./routes/course.routes.js'),
      importRoute('./routes/quiz.routes.js'),
      importRoute('./routes/dashboard.routes.js'),
      importRoute('./routes/admin.routes.js'),
    ]);

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);

  // ── 404 Handler ──────────────────────────────────────────────────────────

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl} — route not found.`,
    });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────

  app.use(errorHandler);

  // ── Start Listening ──────────────────────────────────────────────────────

  const server = app.listen(config.PORT, () => {
    console.log('');
    console.log('🚀 ─────────────────────────────────────────────────');
    console.log(`   EduSmart API Server running`);
    console.log(`   ➜ Local:   http://localhost:${config.PORT}`);
    console.log(`   ➜ Health:  http://localhost:${config.PORT}/api/health`);
    console.log(`   ➜ Env:     ${config.NODE_ENV}`);
    console.log('─────────────────────────────────────────────────────');
    console.log('');
  });

  // ── Unhandled Errors ─────────────────────────────────────────────────────

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Promise Rejection:', reason);
    console.error('At promise:', promise);
    // Graceful shutdown
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    server.close(() => {
      process.exit(1);
    });
  });

  return server;
};

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

export default app;
