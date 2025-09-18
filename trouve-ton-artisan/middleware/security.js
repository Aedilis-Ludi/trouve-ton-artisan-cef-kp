// middleware/security.js
// Middlewares de sécurité pour l'API

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult, param, query } = require('express-validator');

/* RATE LIMITING */

// Rate limit général pour l'API 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                 // 500 req / 15 min / IP
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health'
});

// Rate limit strict pour les formulaires de contact
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,                   // 5 emails / heure / IP
  message: {
    error: "Trop d'emails envoyés depuis cette IP, veuillez réessayer dans 1 heure.",
    code: 'CONTACT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit pour la recherche
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,             // 30 recherches / min / IP
  message: {
    error: 'Trop de recherches effectuées, veuillez patienter 1 minute.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/* VALIDATION DES DONNÉES */

// Validation pour la recherche d'artisans
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La recherche doit contenir entre 1 et 100 caractères')
    .escape(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50')
    .toInt(),
  query('ville')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de ville doit contenir entre 2 et 100 caractères')
    .escape(),
  query('note_min')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La note minimum doit être entre 0 et 5')
    .toFloat()
];

// Validation pour les paramètres d'ID 
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage("L'ID doit être un entier positif")
    .toInt()
];

// Validation pour le formulaire de contact
const validateContact = [
  param('artisan_id')
    .isInt({ min: 1 })
    .withMessage("L'ID artisan doit être un entier positif")
    .toInt(),

  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .withMessage("L'adresse email n'est pas valide")
    .normalizeEmail(),

  body('objet')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("L'objet doit contenir entre 5 et 200 caractères")
    .escape(),

  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Le message doit contenir entre 10 et 2000 caractères')
    .custom((val) => {
      if (/<[a-z][\s\S]*>/i.test(val)) {
        throw new Error('HTML interdit dans le message');
      }
      return true;
    })
    .escape(),
];

/* MIDDLEWARE DE GESTION DES ERREURS DE VALIDATION */

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

/* HELMET */

const FRONT_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],

      // scripts chargés depuis CDNs autorisés
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],

      // styles (inline pour bootstrap/focus) + CDNs
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],

      // images
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:"
      ],

      // fonts (depuis /fonts, data:, et cdnjs si nécessaire)
      fontSrc: [
        "'self'",
        "data:",
        "https://cdnjs.cloudflare.com"
      ],

      // connexions AJAX/WS (front → API)
      connectSrc: [
        "'self'",
        FRONT_ORIGIN
      ],

      // upgrade http → https si servi en https
      upgradeInsecureRequests: []
    }
  },

  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  }
});

/* CORS OPTIONS */

const corsOptions = {
  origin: function (origin, callback) {
    const envOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = [
      'http://localhost:3000',       // React dev
      'http://localhost:3001',       // API dev
      'http://localhost:5173',       // Vite dev
      'https://trouve-ton-artisan.fr', // Prod (exemple)
    ];
    if (envOrigin && !allowedOrigins.includes(envOrigin)) {
      allowedOrigins.push(envOrigin);
    }

    // Autorise Postman 
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origine non autorisée: ${origin}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

/* LOGGING SÉCURISÉ */

const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  const suspiciousPatterns = [
    /union.*select/i,      // SQLi
    /<script/i,            // XSS
    /javascript:/i,        // XSS
    /\.\.\/\.\.\//,        // Path traversal
    /eval\(/i,             // Code injection
    /exec\(/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern =>
    pattern.test(req.url) ||
    pattern.test(JSON.stringify(req.body || {})) ||
    pattern.test(JSON.stringify(req.query || {}))
  );

  if (isSuspicious) {
    console.warn(`🚨 REQUÊTE SUSPECTE: ${req.method} ${req.url} depuis ${req.ip}`);
    console.warn(`Body:`, req.body);
    console.warn(`Query:`, req.query);
  }

  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`);
    }
    originalSend.call(this, body);
  };

  next();
};

/* SANITIZE */

const sanitizeInput = (req, res, next) => {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of dangerousKeys) {
      if (key in obj) delete obj[key];
    }
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'object') sanitizeObject(v);
    }
    return obj;
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

/* EXPORTS */

module.exports = {
  // Rate limiters
  apiLimiter,
  contactLimiter,
  searchLimiter,

  // Validators
  validateSearch,
  validateId,
  validateContact,
  handleValidationErrors,

  // Security middlewares
  helmetConfig,
  corsOptions,
  securityLogger,
  sanitizeInput,

  combineMiddlewares: (...middlewares) => {
    return (req, res, next) => {
      const run = (i) => {
        if (i >= middlewares.length) return next();
        middlewares[i](req, res, (err) => (err ? next(err) : run(i + 1)));
      };
      run(0);
    };
  }
};
