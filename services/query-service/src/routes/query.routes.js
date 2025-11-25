const express = require('express');
const { body } = require('express-validator');
const {
  consultaRAG,
  getUserById,
  listUsers,
} = require('../controllers/query.controller');
const {
  validateEntraToken,
} = require('../../shared/middleware/validateEntraToken');
const { apiLimiter } = require('../../shared/middleware/rateLimiter');
const {
  handleValidationErrors,
  sanitizeBody,
} = require('../../shared/middleware/inputSanitizer');

const router = express.Router();

/**
 * @route POST /query/consulta
 * @desc Consulta en lenguaje natural con RAG + LLM
 * @access Protected + Rate Limited
 */
router.post(
  '/consulta',
  validateEntraToken,
  apiLimiter, // Más restrictivo por costo de LLM
  sanitizeBody,
  [
    body('pregunta')
      .trim()
      .notEmpty()
      .withMessage('La pregunta es requerida')
      .isLength({ max: 500 })
      .withMessage('La pregunta no puede exceder 500 caracteres'),
  ],
  handleValidationErrors,
  consultaRAG
);

/**
 * @route GET /query/users
 * @desc Listar todos los usuarios
 * @access Protected
 */
router.get('/users', validateEntraToken, listUsers);

/**
 * @route GET /query/:id
 * @desc Obtener usuario por documento
 * @access Protected
 */
router.get('/:id', validateEntraToken, getUserById);

module.exports = router;
