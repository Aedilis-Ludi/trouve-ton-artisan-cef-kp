// server.js
// Serveur principal de l'API Trouve ton artisan

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Middlewares sécurité
const {
  apiLimiter,
  helmetConfig,
  corsOptions,
  securityLogger,
  sanitizeInput,
  contactLimiter, 
} = require('./middleware/security');

// DB
const { testConnection, syncDatabase } = require('./config/database');

// Routes
const artisansRoutes = require('./routes/artisans');
const categoriesRoutes = require('./routes/categories');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3001;

/* BASE CONFIG */
app.set('trust proxy', 1);
app.disable('x-powered-by'); 

/* SÉCURITÉ (Helmet) */
app.use(helmetConfig);

/* CORS */
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* PARSERS */
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      if (!buf || buf.length === 0) return;
      try {
        JSON.parse(buf.toString());
      } catch {
        const err = new Error('INVALID_JSON');
        err.statusCode = 400;
        throw err;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* LOG + SANITIZE */
app.use(securityLogger);
app.use(sanitizeInput);

/* FICHIERS STATIQUES (images)*/

app.use('/images', express.static(path.join(__dirname, '../public/images')));

/* RATE LIMIT GLOBAL */
if (process.env.NODE_ENV === 'production') {
  app.use(apiLimiter);
  console.log('🔒 Rate limiting activé (production)');
} else {
  console.log('🔓 Rate limiting désactivé (développement)');
}

/* HEALTH & INFO */
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

app.get('/api/info', async (req, res) => {
  try {
    const { getDatabaseStats } = require('./models');
    const dbStats = await getDatabaseStats();

    res.json({
      success: true,
      api: {
        nom: 'API Trouve ton artisan',
        version: '1.0.0',
        description:
          'API pour la plateforme des artisans de la région Auvergne-Rhône-Alpes',
        documentation: '/api/docs',
        contact: 'adilis.ludi@gmail.com',
      },
      region: {
        nom: 'Auvergne-Rhône-Alpes',
        departements: [
          'Ain (01)',
          'Allier (03)',
          'Ardèche (07)',
          'Cantal (15)',
          'Drôme (26)',
          'Isère (38)',
          'Loire (42)',
          'Haute-Loire (43)',
          'Puy-de-Dôme (63)',
          'Rhône (69)',
          'Savoie (73)',
          'Haute-Savoie (74)',
        ],
      },
      statistiques: dbStats || { message: 'Statistiques non disponibles' },
      endpoints: {
        categories: '/api/categories',
        artisans: '/api/artisans',
        contact: '/api/contact/:artisan_id',
        recherche: '/api/artisans/search?q=...',
        artisans_du_mois: '/api/artisans/du-mois',
      },
    });
  } catch {
    res.json({
      success: true,
      api: {
        nom: 'API Trouve ton artisan',
        version: '1.0.0',
        status: 'Démarrage en cours...',
      },
    });
  }
});

/* ROUTES */
app.use('/api/categories', categoriesRoutes);
app.use('/api/artisans', artisansRoutes);

// On protège la route contact avec un rate limit spécifique + (les validators sont dans la route)
app.use('/api/contact', contactLimiter, contactRoutes);

/* DOC SIMPLE */
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      base_url: `http://localhost:${PORT}/api`,
      endpoints: {
        categories: {
          'GET /categories': 'Liste des catégories',
          'GET /categories?with_stats=true': 'Catégories avec statistiques',
          'GET /categories/:id': "Détail d'une catégorie",
          'GET /categories/:id/specialites': "Spécialités d'une catégorie",
          'GET /categories/:id/artisans': "Artisans d'une catégorie",
        },
        artisans: {
          'GET /artisans': 'Liste paginée des artisans (avec filtres)',
          'GET /artisans/:id': "Détail d'un artisan",
          'GET /artisans/du-mois': 'Artisans du mois',
          'GET /artisans/search?q=...': "Recherche d'artisans",
          'GET /artisans/stats': 'Statistiques des artisans',
          'GET /artisans/categorie/:id': 'Artisans par catégorie',
        },
        contact: {
          'POST /contact/:artisan_id': 'Envoyer un message à un artisan',
          'GET /contact/stats': 'Statistiques des contacts',
        },
      },
      filtres_disponibles: {
        artisans: [
          'q',
          'ville',
          'departement',
          'specialite_id',
          'categorie_id',
          'note_min',
          'sort',
        ],
        pagination: ['page', 'limit'],
      },
      exemples: {
        'Artisans de Lyon': '/artisans?ville=Lyon',
        'Menuisiers bien notés': '/artisans?specialite_id=1&note_min=4.0',
        Recherche: '/artisans/search?q=menuiserie',
        'Catégorie Bâtiment': '/categories/1/artisans',
      },
    },
  });
});

/* 404 */
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    code: 'ENDPOINT_NOT_FOUND',
    available_endpoints: [
      '/api/health',
      '/api/info',
      '/api/docs',
      '/api/categories',
      '/api/artisans',
      '/api/contact/:artisan_id',
    ],
    requested: `${req.method} ${req.path}`,
  });
});

/* GESTION ERREURS GLOBALES */
app.use((error, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Erreur serveur:', error);
  }

  if (error.message === 'INVALID_JSON' || error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide',
      code: 'INVALID_JSON',
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      code: 'VALIDATION_ERROR',
      errors: error.errors?.map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      })),
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Conflit - Donnée déjà existante',
      code: 'DUPLICATE_ENTRY',
      field: error.errors?.[0]?.path,
    });
  }

  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible',
      code: 'DATABASE_CONNECTION_ERROR',
    });
  }

  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Origine non autorisée',
      code: 'CORS_ERROR',
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

/* START */
const startServer = async () => {
  try {
    console.log("🚀 Démarrage de l'API Trouve ton artisan...");
    console.log('📍 Région Auvergne-Rhône-Alpes');
    console.log('=====================================');

    console.log('🔌 Test de connexion à la base de données...');
    await testConnection();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Synchronisation des modèles...');
      await syncDatabase(false);
    }

    try {
      const { getDatabaseStats } = require('./models');
      const stats = await getDatabaseStats();
      if (stats) {
        console.log('📊 Statistiques de la base :');
        console.log(`   • Catégories: ${stats.category || 0}`);
        console.log(`   • Spécialités: ${stats.specialite || 0}`);
        console.log(`   • Artisans: ${stats.artisan || 0}`);
      }
    } catch {
      console.log('⚠️ Statistiques non disponibles (normal au premier démarrage)');
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('✅ Configuration email activée');
    } else {
      console.log('⚠️ Configuration email manquante - Emails désactivés');
    }

    app.listen(PORT, () => {
      console.log('=====================================');
      console.log(`✅ Serveur démarré avec succès !`);
      console.log(`🌐 API : http://localhost:${PORT}`);
      console.log(`📚 Docs : http://localhost:${PORT}/api/docs`);
      console.log(`❤️ Health : http://localhost:${PORT}/api/health`);
      console.log('=====================================');
      console.log(`🛠️ Mode: ${process.env.NODE_ENV}`);
      console.log(`📧 Emails: ${process.env.EMAIL_USER ? 'Activés' : 'Désactivés'}`);
      console.log('=====================================');
      console.log('🎯 Endpoints:');
      console.log('   • GET  /api/categories');
      console.log('   • GET  /api/artisans');
      console.log('   • GET  /api/artisans/du-mois');
      console.log('   • POST /api/contact/:artisan_id');
      console.log('=====================================');
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    console.error('💡 Vérifie la configuration DB (.env) et les droits MySQL.');
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

startServer();

module.exports = app;
