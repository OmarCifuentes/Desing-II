const handleValidationError = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Error de validación',
        details: errors
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        error: 'Valor duplicado',
        details: [`El ${field} ya está registrado`]
      });
    }
    
    next(err);
  };
  
  module.exports = handleValidationError;