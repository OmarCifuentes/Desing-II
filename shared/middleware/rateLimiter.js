const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('redis');

/**
 * RATE LIMITING MIDDLEWARE
 * Protege contra ataques de fuerza bruta y DDoS
 * Usa Redis solo si REDIS_URL está configurada
 */

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    legacyMode: false,
  });

  redisClient.connect().catch((err) => {
    console.error('Error connecting to Redis for rate limiting:', err);
  });
}

/**
 * Configurar RedisStore para rate-limit-redis v4.x
 * Requiere sendCommand en vez de client
 */
function createRedisStore(prefix) {
  if (!redisClient) return undefined;

  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });
}

/**
 * Rate limiter general (para todos los endpoints)
 */
const generalLimiter = rateLimit({
  store: createRedisStore('rl:general:'),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Demasiadas peticiones',
    details: 'Ha excedido el límite de peticiones. Intente de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiadas peticiones',
      details: 'Ha excedido el límite de peticiones. Intente de nuevo más tarde.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Rate limiter estricto para autenticación
 */
const authLimiter = rateLimit({
  store: createRedisStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos de autenticación',
    details:
      'Ha excedido el límite de intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const username = req.body?.username || 'unknown';
    return `${ip}:${username}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados intentos de autenticación',
      details:
        'Ha excedido el límite de intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Rate limiter para API intensiva (RAG/LLM)
 */
const apiLimiter = rateLimit({
  store: createRedisStore('rl:api:'),
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: 'Límite de API excedido',
    details: 'Ha realizado demasiadas consultas. Intente de nuevo en 1 minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.oid || req.ip || req.connection.remoteAddress,
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
};
