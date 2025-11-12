const mongoose = require('mongoose');

const authUserSchema = mongoose.Schema(
  {
    username: { 
      type: String, 
      required: [true, 'El nombre de usuario es requerido'],
      unique: true,
      minlength: [4, 'El nombre de usuario debe tener al menos 4 caracteres']
    },
    password: { 
      type: String, 
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    email: { 
      type: String, 
      required: [true, 'El correo electrónico es requerido'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'El formato del correo electrónico no es válido'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuthUser', authUserSchema);