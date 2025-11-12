const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    idType: { type: String, enum: ['TI', 'CC'] },
    id: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    surname: { type: String },
    birthdate: { type: Date },
    gender: { type: String },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    photoBase64: { type: String }, 
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);