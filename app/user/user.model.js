const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    idType: { 
      type: String, 
      enum: ['TI', 'CC'], 
      required: [true, 'El tipo de documento es requerido'] 
    },
    id: { 
      type: String, 
      required: [true, 'El número de documento es requerido'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^\d{1,10}$/.test(v);
        },
        message: 'El número de documento debe contener solo números (máx 10 caracteres)'
      }
    },
    firstName: { 
      type: String, 
      required: [true, 'El primer nombre es requerido'],
      maxlength: [30, 'El primer nombre no puede superar los 30 caracteres'],
      validate: {
        validator: function(v) {
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'El primer nombre no puede contener números'
      }
    },
    lastName: { 
      type: String,
      maxlength: [30, 'El segundo nombre no puede superar los 30 caracteres'],
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'El segundo nombre no puede contener números'
      }
    },
    surname: { 
      type: String, 
      required: [true, 'Los apellidos son requeridos'],
      maxlength: [60, 'Los apellidos no pueden superar los 60 caracteres'],
      validate: {
        validator: function(v) {
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'Los apellidos no pueden contener números'
      }
    },
    birthdate: { 
      type: Date, 
      required: [true, 'La fecha de nacimiento es requerida'] 
    },
    gender: {
      type: String,
      required: [true, 'El género es requerido'],
      enum: {
        values: ['Masculino', 'Femenino', 'No binario', 'Prefiero no responder'],
        message: 'Género debe ser: Masculino, Femenino, No binario o Prefiero no responder'
      }
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
    phone: { 
      type: String,
      required: [true, 'El celular es requerido'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: 'El celular debe contener exactamente 10 dígitos'
      }
    },
    // 🆕 CAMBIO: Guardar foto en Base64
    photoBase64: { 
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Opcional
          // Validar que sea Base64 y no exceda ~2MB
          const sizeInBytes = (v.length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          return sizeInMB <= 2;
        },
        message: 'La imagen no debe superar los 2MB'
      }
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);