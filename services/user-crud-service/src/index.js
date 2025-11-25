require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Ensure this is here
console.log('Starting User CRUD Service v2.0-FixMongoose'); // Version marker
const userRoutes = require('./routes/user.routes');
const { connect: connectEventBus } = require('./events/eventPublisher');
const photoUploadService = require('./services/photoUpload.service');
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
const PORT = process.env.PORT || 8080;

//==========================================
//MONGODBCONNECTION
//==========================================
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('USER-CRUD-SERVICE: MongoDB connected'))
  .catch((err) => {
    console.error('USER-CRUD-SERVICE: MongoDB connection error:', err.message);
    process.exit(1);
  });

//==========================================
//RABBITMQCONNECTION
//==========================================
connectEventBus()
  .then((connected) => {
    if (connected) {
      console.log('USER-CRUD-SERVICE: RabbitMQ connected');
    }
  })
  .catch((err) => {
    console.warn('USER-CRUD-SERVICE: RabbitMQ connection failed:', err.message);
  });

//==========================================
//AZUREBLOBSTORAGEINITIALIZATION
//==========================================
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  photoUploadService
    .initialize()
    .then(() => console.log('USER-CRUD-SERVICE: Azure Storage initialized'))
    .catch((err) => console.warn('Azure Storage init failed:', err.message));
} else {
  console.warn('AZURE_STORAGE_CONNECTION_STRING not set - photo upload disabled');
}

//==========================================
//MIDDLEWAREGLOBAL
//==========================================
app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(generalLimiter);

//==========================================
//HEALTHCHECK
//==========================================
app.get('/health', async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'healthy',
    service: 'user-crud-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
  });
});

//==========================================
//ROUTES
//==========================================
app.use('/user', userRoutes);

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
  console.log(`USER-CRUD-SERVICE: Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections');
  await mongoose.connection.close();
  process.exit(0);
});
