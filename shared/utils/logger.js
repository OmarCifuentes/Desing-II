const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * GLOBAL LOGGER UTILITY
 * Función reutilizable para logging consistente en todos los servicios
 * Publica eventos a RabbitMQ para procesamiento asíncrono
 */

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logServiceUrl =
      process.env.LOG_SERVICE_URL || 'http://log-service:8082';
    this.rabbitmqUrl = process.env.RABBITMQ_URL;
  }

  /**
   * Log general de eventos
   */
  async logEvent({
    userID,
    idType = 'CC',
    action,
    severity = 'info',
    data = {},
    requestId = null,
    httpMethod = null,
    httpStatus = null,
    endpoint = null,
    ipAddress = null,
    userAgent = null,
    duration = null,
    errorMessage = null,
    errorStack = null,
    userEmail = null,
  }) {
    const logEntry = {
      requestId: requestId || uuidv4(),
      serviceName: this.serviceName,
      userID,
      idType,
      userEmail,
      action,
      severity,
      data,
      httpMethod,
      httpStatus,
      endpoint,
      ipAddress,
      userAgent,
      duration,
      errorMessage,
      errorStack,
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Intentar enviar a log-service de forma asíncrona
    try {
      await axios.post(`${this.logServiceUrl}/log`, logEntry, {
        timeout: 3000,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Si falla, al menos logear en consola (no bloquear operación)
      console.warn('Failed to send log to log-service:', error.message);
    }
  }

  /**
   * Log de creación de recursos
   */
  async logCreate(userID, data, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: 'Created',
      severity: 'info',
      data,
      ...requestMeta,
    });
  }

  /**
   * Log de modificación
   */
  async logUpdate(userID, data, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: 'Modified',
      severity: 'info',
      data,
      ...requestMeta,
    });
  }

  /**
   * Log de eliminación
   */
  async logDelete(userID, data, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: 'Deleted',
      severity: 'warning',
      data,
      ...requestMeta,
    });
  }

  /**
   * Log de lectura
   */
  async logRead(userID, data, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: 'Read',
      severity: 'info',
      data,
      ...requestMeta,
    });
  }

  /**
   * Log de consulta RAG
   */
  async logRAGQuery(userID, pregunta, respuesta, metodo, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: 'ConsultaRAG',
      severity: 'info',
      data: { pregunta, respuesta, metodo },
      ...requestMeta,
    });
  }

  /**
   * Log de autenticación
   */
  async logAuth(userID, success, requestMeta = {}) {
    return this.logEvent({
      userID,
      action: success ? 'Login' : 'AuthFailed',
      severity: success ? 'info' : 'warning',
      data: { success },
      ...requestMeta,
    });
  }

  /**
   * Log de errores
   */
  async logError(userID, error, requestMeta = {}) {
    return this.logEvent({
      userID: userID || 'SISTEMA',
      action:
        error.name === 'ValidationError' ? 'ValidationError' : 'ServerError',
      severity: 'error',
      errorMessage: error.message,
      errorStack: error.stack,
      data: error.details || {},
      ...requestMeta,
    });
  }

  /**
   * Extraer metadata de request de Express
   */
  extractRequestMeta(req) {
    return {
      requestId: req.id || req.headers['x-request-id'] || uuidv4(),
      httpMethod: req.method,
      endpoint: req.originalUrl || req.url,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email || null,
      idType: req.user?.idType || 'CC',
    };
  }
}

/**
 * Factory para crear logger por servicio
 */
function createLogger(serviceName) {
  return new Logger(serviceName);
}

module.exports = { Logger, createLogger };
