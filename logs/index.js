const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logRoutes = require('./log/log.routes');

const app = express();

if (!process.env.MONGO_URI) {
  throw new Error("Falta la variable MONGO_URI en el archivo .env");
}

const mongoURI = process.env.MONGO_URI;


mongoose
  .connect(mongoURI, { authSource: 'admin' })
  .then(() => console.log('✅ LOGS: MongoDB conectado'))
  .catch((err) => console.error('❌ LOGS: Error MongoDB:', err.message));

app.use(cors());
app.use(express.json());
app.use('/log', logRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

const PORT = 8082;
app.listen(PORT, () => console.log(`🚀 LOGS: Servidor en puerto ${PORT}`));