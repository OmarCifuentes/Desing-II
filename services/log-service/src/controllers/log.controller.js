const Log = require('../../shared/models/Log.model');

/**
 *LOG CONTROLLER
 *Endpoints para consultar logs con filtros
 */

/**
 * Crear log (usado internamente por eventos o HTTP)
 */
const createLog = async (req, res, next) => {
  try {
    const logData = req.body;

    const newLog = new Log(logData);
    await newLog.save();

    res.status(201).json({
      message: 'Log creado exitosamente',
      log: newLog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener logs con filtros
 * Query params: ?id=123&idType=CC&dateFrom=2024-01-01&dateTo=2024-12-31
 */
const getLogs = async (req, res, next) => {
  try {
    const { id, idType, dateFrom, dateTo, severity, action, serviceName } =
      req.query;

    const filters = {};

    if (id) filters.userID = id;
    if (idType) filters.idType = idType;
    if (severity) filters.severity = severity;
    if (action) filters.action = action;
    if (serviceName) filters.serviceName = serviceName;

    if (dateFrom || dateTo) {
      filters.time = {};
      if (dateFrom) filters.time.$gte = new Date(dateFrom);
      if (dateTo) filters.time.$lte = new Date(dateTo);
    }

    const logs = await Log.find(filters).sort({ time: -1 }).limit(1000).lean();

    res.status(200).json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener logs por usuario específico
 */
const getLogsByUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) && !/^[a-f0-9-]{36}$/i.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'El ID debe ser numérico o un UUID válido',
      });
    }

    const logs = await Log.findByUser(id);

    res.status(200).json({
      userID: id,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener logs por requestId (correlación)
 */
const getLogsByRequestId = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const logs = await Log.findByRequestId(requestId);

    res.status(200).json({
      requestId,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener errores recientes
 */
const getErrors = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const errors = await Log.findErrors({ limit: parseInt(limit) });

    res.status(200).json({
      count: errors.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLog,
  getLogs,
  getLogsByUser,
  getLogsByRequestId,
  getErrors,
};
