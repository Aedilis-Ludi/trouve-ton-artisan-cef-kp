// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== BASE CONFIG =====
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ===== SÉCURITÉ =====
const {
  apiLimiter,
  helmetConfig,
  corsOptions,
  securityLogger,
  sanitizeInput,
  contactLimiter,
} = require('./middleware/security');

app.use(helmetConfig);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ===== PARSERS =====
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (!buf || buf.length === 0) return;
    try { JSON.parse(buf.toString()); }
    catch {
      const err = new Error('INVALID_JSON');
      err.statusCode = 400;
      throw err;
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== LOG + SANITIZE =====
app.use(securityLogger);
app.use(sanitizeInput);

// ===== STATIC FICHIERS API (ex: uploads/images) =====
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// ===== RATE LIMIT (prod) =====
if (process.env.NODE_ENV === 'production') {
  app.use(apiLimiter);
  console.log('🔒 Rate limiting activé (production)');
} else {
  console.log('🔓 Rate limiting désactivé (développement)');
}

// ===== DB =====
const { testConnection, syncDatabase } = require('./config/database');

// Flags pour contrôler la sync en prod
const SHOULD_SYNC = process.env.SYNC_DB_ON_BOOT === 'true';
const SYNC_FORCE = process.env.SYNC_DB_FORCE === 'true'; // ⚠️ true = DROP & recrée

// ===== HEALTH =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Trouve ton artisan - Service actif',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    database: 'MySQL - trouve_ton_artisan',
    services: {
      database: true,
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    },
  });
});

// ===== INFO =====
app.get('/api/info', async (req, res) => {
  try {
    const { getDatabaseStats } = require('./models');
    const dbStats = await getDatabaseStats();
    res.json({
      success: true,
      api: {
        nom: 'API Trouve ton artisan',
        version: '1.0.0',
        description: 'API pour la plateforme des artisans de la région Auvergne-Rhône-Alpes',
        documentation: '/api/docs',
        contact: 'adilis.ludi@gmail.com',
      },
      statistiques: dbStats || { message: 'Statistiques non disponibles' },
    });
  } catch {
    res.json({
      success: true,
      api: { nom: 'API Trouve ton artisan', version: '1.0.0', status: 'Démarrage en cours...' },
    });
  }
});

// ===== ROUTES API =====
app.use('/api/categories', require('./routes/categories'));
app.use('/api/artisans', require('./routes/artisans'));
app.use('/api/contact', contactLimiter, require('./routes/contact'));

// ===== DOC SIMPLE =====
app.get('/api/docs', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}/api`;
  res.json({
    success: true,
    documentation: {
      base_url: base,
      endpoints: {
        categories: '/api/categories',
        artisans: '/api/artisans',
        contact: '/api/contact/:artisan_id',
        recherche: '/api/artisans/search?q=...',
        artisans_du_mois: '/api/artisans/du-mois',
      },
    },
  });
});

// ===== SERVIR LE FRONT (APRÈS les routes API) =====
app.use(express.static(path.join(__dirname, '../trouve-ton-artisan-frontend/build')));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../trouve-ton-artisan-frontend/build', 'index.html'));
});

// ===== 404 API =====
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint API non trouvé',
    code: 'ENDPOINT_NOT_FOUND',
    requested: `${req.method} ${req.path}`,
  });
});

// ===== ERREURS =====
app.use((error, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Erreur serveur:', error);
  }
  if (error.message === 'INVALID_JSON' || error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Format JSON invalide', code: 'INVALID_JSON' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false, message: 'Erreur de validation des données', code: 'VALIDATION_ERROR',
      errors: error.errors?.map(e => ({ field: e.path, message: e.message, value: e.value })),
    });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Conflit - Donnée déjà existante', code: 'DUPLICATE_ENTRY', field: error.errors?.[0]?.path });
  }
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({ success: false, message: 'Service temporairement indisponible', code: 'DATABASE_CONNECTION_ERROR' });
  }
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: 'Accès refusé - Origine non autorisée', code: 'CORS_ERROR' });
  }
  res.status(error.statusCode || 500).json({ success: false, message: 'Erreur interne du serveur', code: 'INTERNAL_SERVER_ERROR' });
});

// ===== START =====
const startServer = async () => {
  try {
    console.log("🚀 Démarrage de l'API Trouve ton artisan...");
    await testConnection();

    // ⚡ Nouvelle logique : sync activable en prod via variables
    if (SHOULD_SYNC) {
      console.log(`🔧 Sync DB (force=${SYNC_FORCE})...`);
      await syncDatabase(SYNC_FORCE);
      console.log('✅ Sync terminé');
    } else if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false);
    }

    app.listen(PORT, () => {
      console.log(`✅ Serveur sur ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();

module.exports = app;
