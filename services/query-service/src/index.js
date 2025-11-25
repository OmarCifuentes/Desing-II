require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const queryRoutes = require('./routes/query.routes');
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
const PORT = process.env.PORT || 8081;

//==========================================
//MONGODBCONNECTION
//==========================================
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('QUERY-SERVICE: MongoDB connected'))
  .catch((err) => {
    console.error('QUERY-SERVICE: MongoDB connection error:', err.message);
    process.exit(1);
  });

//==========================================
//MIDDLEWAREGLOBAL
//==========================================
app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

//==========================================
//HEALTHCHECK
//==========================================
app.get('/health', async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const llmConfigured = !!process.env.OPENROUTER_API_KEY;

  res.status(200).json({
    status: 'healthy',
    service: 'query-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
    llm: llmConfigured ? 'configured' : 'not configured',
  });
});

//==========================================
//ROUTES
//==========================================
app.use('/query', queryRoutes);

//==========================================
//ERRORHANDLING
//==========================================
app.use(notFoundHandler);
app.use(corsErrorHandler);
app.use(errorHandler);

//==========================================
//STARTSERVER
//==========================================
app.listen(PORT, () => {
  console.log(`QUERY-SERVICE: Server running on port ${PORT}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || 'default'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections');
  await mongoose.connection.close();
  process.exit(0);
});
