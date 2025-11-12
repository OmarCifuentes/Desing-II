const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
  userID: { type: String, required: true },
  idType: { type: String, enum: ['TI', 'CC'] },
  action: { type: String, required: true },
  data: { type: String },
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);