require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { errorHandler } = require('./api/middleware/error');
const { globalLimiter, authLimiter } = require('./api/middleware/rate-limit');
const authRoutes = require('./api/routes/auth');
const postRoutes = require('./api/routes/posts');
const userRoutes = require('./api/routes/users');
const taxonomyRoutes = require('./api/routes/taxonomies');
const webhookRoutes = require('./api/routes/webhooks');
const uploadRoutes = require('./api/routes/upload');
const { flushAll } = require('./core/store');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: permite localhost en dev, restringe en prod via variable
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (CORS_ORIGIN && CORS_ORIGIN !== '*') {
  app.use(cors({ origin: CORS_ORIGIN.split(','), credentials: true }));
} else if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: cors() configurado con origen wildcard en produccion. Define CORS_ORIGIN.');
  app.use(cors());
} else {
  app.use(cors());
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting global
app.use('/api/', globalLimiter.middleware());

// Rate limiting estricto en auth (fuerza bruta)
app.use('/api/auth/', authLimiter.middleware());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/taxonomies', taxonomyRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

process.on('SIGINT', () => {
  flushAll();
  process.exit(0);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Headless CMS running on http://localhost:${PORT}`);
  });
}

module.exports = app;


