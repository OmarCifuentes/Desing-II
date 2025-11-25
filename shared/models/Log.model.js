const mongoose = require('mongoose');

/**
 * SHARED LOG MODEL
 * Modelo estandarizado de logs con estructura mejorada
 * Incluye requestId, severity, serviceName para auditoría completa
 */

const logSchema = new mongoose.Schema(
  {
    //==========================================
    //IDENTIFICADORES
    //==========================================
    requestId: {
      type: String,
      required: true,
      index: true,
      comment: 'UUID para correlación de requests',
    },

    serviceName: {
      type: String,
      required: true,
      enum: [
        'user-crud-service',
        'query-service',
        'log-service',
        'auth-service',
        'gateway',
      ],
      index: true,
    },

    //==========================================
    // INFORMACIÓN DEL USUARIO
    //==========================================
    userID: {
      type: String,
      required: true,
      index: true,
      comment: 'Número de documento o OID de Entra ID',
    },

    idType: {
      type: String,
      enum: ['TI', 'CC', 'ENTRA_OID', 'SISTEMA'],
      default: 'CC',
    },

    userEmail: {
      type: String,
      default: null,
    },

    //==========================================
    // ACCIÓN Y SEVERIDAD
    //==========================================
    action: {
      type: String,
      required: true,
      enum: [
        'Created',
        'Modified',
        'Deleted',
        'Read',
        'ConsultaRAG',
        'Login',
        'Logout',
        'AuthFailed',
        'ValidationError',
        'ServerError',
      ],
      index: true,
    },

    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },

    //==========================================
    //DATOS
    //==========================================
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Metadata adicional de la operación',
    },

    //==========================================
    //CONTEXTOHTTP
    //==========================================
    httpMethod: {
      type: String,
      enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      default: null,
    },

    httpStatus: {
      type: Number,
      default: null,
    },

    endpoint: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    //==========================================
    //PERFORMANCE
    //==========================================
    duration: {
      type: Number,
      default: null,
      comment: 'Duración de la operación en ms',
    },

    //==========================================
    //ERRORTRACKING
    //==========================================
    errorMessage: {
      type: String,
      default: null,
    },

    errorStack: {
      type: String,
      default: null,
    },

    //==========================================
    //METADATA
    //==========================================
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },

    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: process.env.NODE_ENV || 'development',
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

//==========================================
// ÍNDICES COMPUESTOS PARA QUERIES COMUNES
//==========================================
logSchema.index({ userID: 1, time: -1 });
logSchema.index({ serviceName: 1, time: -1 });
logSchema.index({ action: 1, time: -1 });
logSchema.index({ severity: 1, time: -1 });
logSchema.index({ time: -1 }); // Para obtener logs recientes
logSchema.index({ requestId: 1, time: -1 });

//==========================================
// MÉTODOS ESTÁTICOS
//==========================================
logSchema.statics.findByUser = function (userID, options = {}) {
  const query = { userID };
  return this
    .find(query)
    .sort({ time: -1 })
    .limit(options.limit || 100);
};

logSchema.statics.findByDateRange = function (
  startDate,
  endDate,
  options = {}
) {
  const query = {
    time: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  if (options.severity) query.severity = options.severity;
  if (options.action) query.action = options.action;
  if (options.serviceName) query.serviceName = options.serviceName;

  return this
    .find(query)
    .sort({ time: -1 })
    .limit(options.limit || 1000);
};

logSchema.statics.findByRequestId = function (requestId) {
  return this.find({ requestId }).sort({ time: 1 });
};

logSchema.statics.findErrors = function (options = {}) {
  const query = {
    severity: { $in: ['error', 'critical'] },
  };

  if (options.startDate) {
    query.time = { $gte: new Date(options.startDate) };
  }

  return this
    .find(query)
    .sort({ time: -1 })
    .limit(options.limit || 100);
};

//==========================================
// TTL INDEX (opcional - auto-eliminar logs antiguos)
//==========================================
// Descomentar para eliminar logs automáticamente después de 90 días
// logSchema.index({time: 1}, {expireAfterSeconds: 7776000});

module.exports = mongoose.model('Log', logSchema);
