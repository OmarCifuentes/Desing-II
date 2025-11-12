const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./user/user.routes');
const authRoutes = require('./auth/auth.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Usar MONGO_URI de variable de entorno (Docker)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/backendJob';

mongoose
  .connect(mongoURI, { authSource: 'admin' })
  .then(() => console.log('✅ APP: MongoDB conectado'))
  .catch((err) => console.error('❌ APP: Error MongoDB:', err.message));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 APP: Servidor en puerto ${PORT}`));