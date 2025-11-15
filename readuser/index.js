const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./user/user.routes');

const app = express();

if (!process.env.MONGO_URI) {
  throw new Error("Falta la variable MONGO_URI en el archivo .env");
}

const mongoURI = process.env.MONGO_URI;


mongoose
  .connect(mongoURI, { authSource: 'admin' })
  .then(() => console.log('✅ READUSER: MongoDB conectado'))
  .catch((err) => console.error('❌ READUSER: Error MongoDB:', err.message));

app.use(cors());
app.use(express.json());
app.use('/user', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

const PORT = 8081;
app.listen(PORT, () => console.log(`🚀 READUSER: Servidor en puerto ${PORT}`));