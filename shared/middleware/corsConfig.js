const cors = require('cors');

/**
 * CORS CONFIGURATION
 * Configuración restrictiva de CORS basada en whitelisting
 * Reemplaza el cors() abierto que permite TODO origen
 */

// Lista de orígenes permitidos (desde variables de entorno)
const getAllowedOrigins = () => {
  const originsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
  return originsEnv.split(',').map((origin) => origin.trim());
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Permitir requests sin origen (mobile apps, Postman, etc.) solo en desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'), false);
    }
  },

  credentials: true, //Permitir cookies

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
  ],

  exposedHeaders: [
    'X-Request-ID',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],

  maxAge: 86400, // 24 horas de preflight cache

  optionsSuccessStatus: 204,
};

/**
 * Middleware CORS restrictivo
 */
const corsMiddleware = cors(corsOptions);

/**
 * Error handler para errores de CORS
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      error: 'Acceso denegado',
      details: `El origen ${req.headers.origin} no está permitido para acceder a este recurso`,
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware,
  corsErrorHandler,
  getAllowedOrigins,
};
