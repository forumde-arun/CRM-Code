// import './src/config/env.js'; // must stay the first import
// import express from 'express';
// import cors from 'cors';
// import connectDB from './src/config/db.js';
// import api from './src/routes/index.js';
// import webhook from './src/routes/webhook.js';
// import { MetaError } from './src/services/meta.js';

// const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL }));
// app.use(express.json({
//   verify: (req, _res, buf) => {
//     req.rawBody = buf;
//   },
// }));

// app.get('/health', (_req, res) => res.json({ ok: true }));
// app.use('/webhook', webhook);
// app.use('/api', api);

// app.use((err, _req, res, _next) => {
//   console.error(err.message);
//   res.status(err.status || (err instanceof MetaError ? 502 : 500)).json({
//     error: err.message,
//     metaCode: err.code,
//   });
// });

// await connectDB();

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`FlowWA API running on port ${PORT}`));


import './src/config/env.js'; // must stay the first import
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import api from './src/routes/index.js';
import webhook from './src/routes/webhook.js';
import { MetaError } from './src/services/meta.js';
import { log } from './src/utils/logger.js';

process.on('unhandledRejection', (e) => log.error('PROCESS', 'Unhandled rejection: ' + (e?.message || e)));
process.on('uncaughtException', (e) => log.error('PROCESS', 'Uncaught exception: ' + e.message));

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

// Logs every request: method, path (query string removed so the verify token never prints), status, time
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const start = Date.now();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log[level]('HTTP', `${req.method} ${req.originalUrl.split('?')[0]} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/webhook', webhook);
app.use('/api', api);

app.use((err, req, res, _next) => {
  log.error('ERROR', `${req.method} ${req.originalUrl.split('?')[0]}: ${err.message}`, err.code ? { metaCode: err.code } : undefined);
  res.status(err.status || (err instanceof MetaError ? 502 : 500)).json({
    error: err.message,
    metaCode: err.code,
  });
});

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log.info('SERVER', `FlowWA API running on port ${PORT}`);
  log.info('CONFIG', 'Keys present?', {
    META_APP_ID: !!process.env.META_APP_ID,
    META_APP_SECRET: !!process.env.META_APP_SECRET,
    WEBHOOK_VERIFY_TOKEN: !!process.env.WEBHOOK_VERIFY_TOKEN,
    graphVersion: process.env.META_GRAPH_VERSION || 'v21.0',
    msgPerSecond: process.env.MSG_PER_SECOND || 10,
  });
  if (!process.env.META_APP_SECRET) log.warn('CONFIG', 'META_APP_SECRET is empty: every webhook from Meta will be rejected');
  if (!process.env.WEBHOOK_VERIFY_TOKEN) log.warn('CONFIG', 'WEBHOOK_VERIFY_TOKEN is empty: Meta webhook verification will fail');
});