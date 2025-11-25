require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const securityHeaders = require('../shared/middleware/securityHeaders');
const {
  corsMiddleware,
  corsErrorHandler,
} = require('../shared/middleware/corsConfig');
const { generalLimiter } = require('../shared/middleware/rateLimiter');
const requestId = require('../shared/middleware/requestId');
const {
  errorHandler,
  notFoundHandler,
} = require('../shared/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

//==========================================
//MIDDLEWARE GLOBAL
//==========================================
app.use(requestId); //RequestID para correlación
app.use(securityHeaders); //Headers de seguridad
app.use(corsMiddleware); //CORS restrictivo
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter); //Rate limiting

//==========================================
//HEALTHCHECK
//==========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

//==========================================
//ROUTES
//==========================================
app.use('/auth', authRoutes);

//==========================================
//ERROR HANDLING
//==========================================
app.use(notFoundHandler);
app.use(corsErrorHandler);
app.use(errorHandler);

//==========================================
//START SERVER
//==========================================
app.listen(PORT, () => {
  console.log(`AUTH-SERVICE: Server running on port ${PORT}`);
  console.log(`Entra ID Tenant: ${process.env.ENTRA_TENANT_ID}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
