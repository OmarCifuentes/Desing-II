const { v4: uuidv4 } = require('uuid');

/**
 * REQUEST ID MIDDLEWARE
 * Genera un ID único para cada request para correlación de logs
 */
const requestId = (req, res, next) => {
  // Usar header existente si está presente, sino generar nuevo
  req.id = req.headers['x-request-id'] || uuidv4();

  // Agregar a response headers
  res.setHeader('X-Request-ID', req.id);

  next();
};

module.exports = requestId;
