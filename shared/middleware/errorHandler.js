/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * Manejo centralizado y estandarizado de errores
 * Respuestas consistentes entre todos los servicios
 */

const errorHandler = (err, req, res, next) => {
  // Log del error (sin exponer al cliente)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));

    return res.status(400).json({
      error: 'ValidationError',
      message: 'Error de validación en los datos enviados',
      details,
      requestId: req.id,
    });
  }

  // Errores de MongoDB (duplicados, etc.)
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        error: 'DuplicateError',
        message: `El campo '${field}' ya está registrado`,
        details: [{ field, message: 'Valor duplicado' }],
        requestId: req.id,
      });
    }
  }

  // Errores de Cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'InvalidID',
      message: 'El ID proporcionado no es válido',
      details: [{ field: err.path, message: 'Formato inválido' }],
      requestId: req.id,
    });
  }

  // Errores de autenticación (desde middleware)
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'No autenticado',
      requestId: req.id,
    });
  }

  // Errores de autorización
  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'Acceso denegado',
      requestId: req.id,
    });
  }

  // Errores 404
  if (err.status === 404) {
    return res.status(404).json({
      error: 'NotFound',
      message: err.message || 'Recurso no encontrado',
      requestId: req.id,
    });
  }

  // Error de timeout
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return res.status(504).json({
      error: 'Timeout',
      message: 'La operación tardó demasiado tiempo',
      requestId: req.id,
    });
  }

  // Errores de tamaño de payload
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'PayloadTooLarge',
      message: 'El archivo o datos enviados son demasiado grandes',
      requestId: req.id,
    });
  }

  // Error genérico del servidor
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: 'InternalServerError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ha ocurrido un error interno'
        : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    requestId: req.id,
  });
};

/**
 * Manejador de rutas no encontradas (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    requestId: req.id,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
