require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logRoutes = require('./routes/log.routes');
const { startConsumer } = require('./events/logConsumer');
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
const PORT = process.env.PORT || 8082;

//==========================================
//MONGODBCONNECTION
//==========================================
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('LOG-SERVICE: MongoDB connection successful'))
  .catch((err) => {
    console.error('LOG-SERVICE: MongoDB connection error:', err.message);
    process.exit(1);
  });

//==========================================
//RABBITMQCONSUMER
//==========================================
startConsumer()
  .then((started) => {
    if (started) {
      console.log('LOG-SERVICE:Event consumer started');
    }
  })
  .catch((err) => {
    console.warn('LOG-SERVICE:Event consumer failed:', err.message);
  });

//==========================================
//MIDDLEWAREGLOBAL
//==========================================
app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(generalLimiter);

//==========================================
//HEALTHCHECK
//==========================================
app.get('/health', async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'healthy',
    service: 'log-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
  });
});

//==========================================
//ROUTES
//==========================================
app.use('/log', logRoutes);

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
  console.log(`LOG-SERVICE: Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections');
  await mongoose.connection.close();
  process.exit(0);
});
