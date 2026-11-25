
import './src/config/env.js'; // Must remain the first import

import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import connectDB from './src/config/db.js';
import api from './src/routes/index.js';
import webhook from './src/routes/webhook.js';
import { MetaError } from './src/services/meta.js';
import { log } from './src/utils/logger.js';
import subscriptionRoutes from './src/routes/subscriptionRoutes.js';
import planRoutes from './src/routes/planRoutes.js';

// ============================================
// EXPRESS APP
// ============================================

const app = express();

app.set('trust proxy', 1);

// ============================================
// PROCESS ERROR HANDLING
// ============================================

process.on('unhandledRejection', (error) => {
  console.error('\n[UNHANDLED REJECTION]');
  console.error(error);

  log.error(
    'PROCESS',
    'Unhandled rejection: ' + (error?.message || error)
  );
});

process.on('uncaughtException', (error) => {
  console.error('\n[UNCAUGHT EXCEPTION]');
  console.error(error);

  log.error(
    'PROCESS',
    'Uncaught exception: ' + error.message
  );

  process.exit(1);
});

// ============================================
// RATE LIMITING
// ============================================

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });

const loginLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many login attempts. Please try again after 15 minutes.'
);

const googleLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many Google sign-in attempts. Please try again later.'
);

const forgotPasswordLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  'Too many password reset requests. Please try again after an hour.'
);

const resetPasswordLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'Too many password reset attempts. Please try again later.'
);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  })
);

// ============================================
// REQUEST LOGGING
// ============================================

app.use((req, res, next) => {
  const path = req.originalUrl.split('?')[0];
  const start = Date.now();

  console.log('\n====================================');
  console.log(`[REQUEST] ${req.method} ${path}`);
  console.log(`[TIME] ${new Date().toISOString()}`);
  console.log('====================================');

  res.on('finish', () => {
    const duration = Date.now() - start;

    const level =
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : 'info';

    console.log(
      `[RESPONSE] ${req.method} ${path} | Status: ${res.statusCode} | ${duration}ms`
    );

    log[level](
      'HTTP',
      `${req.method} ${path} -> ${res.statusCode} (${duration}ms)`
    );
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      console.error(
        `[CONNECTION CLOSED] ${req.method} ${path}`
      );
    }
  });

  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.use('/api/subscription', subscriptionRoutes);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'CRM API',
  });
});

// ============================================
// META WEBHOOK
// ============================================

app.use('/webhook', webhook);

// ============================================
// AUTHENTICATION RATE LIMITERS
// ============================================

app.use('/api/plans', planRoutes);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/google', googleLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/reset-password', resetPasswordLimiter);

// ============================================
// API ROUTES
// ============================================

app.use('/api', api);

// ============================================
// UNKNOWN ROUTES
// ============================================

app.use((req, res) => {
  console.warn(
    `[NOT FOUND] ${req.method} ${req.originalUrl.split('?')[0]}`
  );

  res.status(404).json({
    error: 'API endpoint not found.',
  });
});

// ============================================
// CENTRAL ERROR HANDLER
// MUST BE THE LAST EXPRESS MIDDLEWARE
// ============================================

app.use((err, req, res, next) => {
  const path = req.originalUrl.split('?')[0];

  console.error('\n========== BACKEND ERROR ==========');
  console.error('Method:', req.method);
  console.error('URL:', path);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('===================================\n');

  log.error(
    'ERROR',
    `${req.method} ${path}: ${err.message}`,
    err.code ? { metaCode: err.code } : undefined
  );

  if (res.headersSent) {
    return next(err);
  }

  const isMetaError = err instanceof MetaError;

  const status =
    err.status || (isMetaError ? 502 : 500);

  return res.status(status).json({
    error: isMetaError
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',

    ...(isMetaError && err.code
      ? { metaCode: err.code }
      : {}),
  });
});

// ============================================
// DATABASE + SERVER STARTUP
// ============================================

try {
  console.log('\n[STARTUP] Connecting to MongoDB...');

  await connectDB();

  console.log('[STARTUP] MongoDB connected successfully.');

  const PORT = Number(process.env.PORT) || 5000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n====================================');
    console.log(`CRM API running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('====================================\n');

    log.info('SERVER', `CRM API running on port ${PORT}`);

    log.info('CONFIG', 'Keys present?', {
      META_APP_ID: !!process.env.META_APP_ID,
      META_APP_SECRET: !!process.env.META_APP_SECRET,
      META_CONFIG_ID: !!process.env.META_CONFIG_ID,
      WEBHOOK_VERIFY_TOKEN: !!process.env.WEBHOOK_VERIFY_TOKEN,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      EMAIL_API_KEY: !!process.env.EMAIL_API_KEY,
      graphVersion: process.env.META_GRAPH_VERSION || 'v21.0',
      msgPerSecond: process.env.MSG_PER_SECOND || 10,
    });

    if (!process.env.META_APP_ID) {
      log.warn(
        'CONFIG',
        'META_APP_ID is missing. Embedded Signup will not work.'
      );
    }

    if (!process.env.META_APP_SECRET) {
      log.warn(
        'CONFIG',
        'META_APP_SECRET is empty: Meta authorization and webhook verification may fail.'
      );
    }

    if (!process.env.META_CONFIG_ID) {
      log.warn(
        'CONFIG',
        'META_CONFIG_ID is missing. Embedded Signup configuration cannot be loaded.'
      );
    }

    if (!process.env.WEBHOOK_VERIFY_TOKEN) {
      log.warn(
        'CONFIG',
        'WEBHOOK_VERIFY_TOKEN is empty: webhook verification will fail.'
      );
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      log.warn(
        'CONFIG',
        'FIREBASE_PROJECT_ID is missing: Google authentication will fail.'
      );
    }
  });

  server.on('error', (error) => {
    console.error('[SERVER ERROR]', error);

    log.error(
      'SERVER',
      `Server error: ${error.message}`
    );

    process.exit(1);
  });

} catch (error) {
  console.error('\n[STARTUP ERROR]');
  console.error(error);
  console.error(error.stack);

  process.exit(1);
}
