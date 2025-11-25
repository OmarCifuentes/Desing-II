const mongoose = require('mongoose');

/**
 * SHARED USER MODEL
 * Modelo unificado con todas las validaciones
 * Usado por user-crud-service y query-service
 * Elimina duplicación de código
 */

const userSchema = new mongoose.Schema(
  {
    //==========================================
    //IDENTIFICACIÓN
    //==========================================
    idType: {
      type: String,
      enum: {
        values: ['TI', 'CC'],
        message: 'Tipo de documento debe ser TI o CC',
      },
      required: [true, 'El tipo de documento es requerido'],
    },

    id: {
      type: String,
      required: [true, 'El número de documento es requerido'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{1,10}$/.test(v);
        },
        message: 'El número de documento debe contener solo números (máximo 10 dígitos)',
      },
      index: true,
    },

    //==========================================
    //INFORMACIÓNPERSONAL
    //==========================================
    // Primer Nombre (Obligatorio)
    firstName: {
      type: String,
      required: [true, 'El primer nombre es requerido'],
      trim: true,
      maxlength: [30, 'El primer nombre no puede superar los 30 caracteres'],
      validate: {
        validator: function (v) {
          // Permite letras con acentos, ñ, espacios
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'El primer nombre solo puede contener letras y espacios',
      },
    },

    // Segundo Nombre (Opcional)
    secondName: {
      type: String,
      trim: true,
      maxlength: [30, 'El segundo nombre no puede superar los 30 caracteres'],
      validate: {
        validator: function (v) {
          if (!v) return true; // Opcional
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'El segundo nombre solo puede contener letras y espacios',
      },
    },

    // DEPRECATED: Mantener por compatibilidad, migrar a secondName
    lastName: {
      type: String,
      trim: true,
      maxlength: [30, 'Este campo está deprecated, usar secondName'],
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'Solo puede contener letras y espacios',
      },
    },

    surname: {
      type: String,
      required: [true, 'Los apellidos son requeridos'],
      trim: true,
      maxlength: [60, 'Los apellidos no pueden superar los 60 caracteres'],
      validate: {
        validator: function (v) {
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v);
        },
        message: 'Los apellidos solo pueden contener letras y espacios',
      },
    },

    birthdate: {
      type: Date,
      required: [true, 'La fecha de nacimiento es requerida'],
      validate: {
        validator: function (v) {
          // No puede ser fecha futura
          return v <= new Date();
        },
        message: 'La fecha de nacimiento no puede ser futura',
      },
    },

    gender: {
      type: String,
      required: [true, 'El género es requerido'],
      enum: {
        values: ['Masculino', 'Femenino', 'No binario', 'Prefiero no reportar'],
        message:
          'Género debe ser: Masculino, Femenino, No binario o Prefiero no reportar',
      },
    },

    //==========================================
    //CONTACTO
    //==========================================
    email: {
      type: String,
      required: [true, 'El correo electrónico es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'El formato del correo electrónico no es válido',
      },
      index: true,
    },

    phone: {
      type: String,
      required: [true, 'El celular es requerido'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'El celular debe contener exactamente 10 dígitos',
      },
    },

    //==========================================
    //FOTO(URLaAzureBlobStorage)
    //==========================================
    photoUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // Opcional
          // Validar URL válida
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'La URL de la foto no es válida',
      },
    },

    //==========================================
    //METADATA
    //==========================================
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: String, //OIDdelusuarioEntraID
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

//==========================================
//ÍNDICESCOMPUESTOS
//==========================================
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ phone: 1, isDeleted: 1 });
userSchema.index({ createdAt: -1 });

//==========================================
//MÉTODOSDEINSTANCIA
//==========================================
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

userSchema.methods.calculateAge = function () {
  if (!this.birthdate) return 0;
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

userSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

//==========================================
//MÉTODOSESTÁTICOS
//==========================================
userSchema.statics.findActive = function () {
  return this.find({ isDeleted: false });
};

userSchema.statics.findByDocument = function (documentId) {
  return this.findOne({ id: documentId, isDeleted: false });
};

//==========================================
//MIDDLEWAREPRE-SAVE
//==========================================
//==========================================
userSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message =
      field === 'email'
        ? 'El correo electrónico ya está registrado'
        : field === 'phone'
          ? 'El número de celular ya está registrado'
          : field === 'id'
            ? 'El número de documento ya está registrado'
            : 'Ya existe un registro con estos datos';

    next(new Error(message));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
