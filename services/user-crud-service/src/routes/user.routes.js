const express = require('express');
const { body } = require('express-validator');
const {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const {
  validateEntraToken,
  requireAdmin,
} = require('../../shared/middleware/validateEntraToken');
const {
  handleValidationErrors,
  mongoSanitizer,
  sanitizeBody,
} = require('../../shared/middleware/inputSanitizer');

const router = express.Router();

/**
 * @route POST /user
 * @desc Crear nuevo usuario
 * @access Protected
 */
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 *@routePOST/user
 *@descCrearnuevousuario
 *@accessProtected
 */
router.post(
  '/',
  validateEntraToken,
  upload.single('photo'), //Esperacampo'photo'enform-data
  mongoSanitizer,
  sanitizeBody,
  [
    body('idType')
      .isIn(['TI', 'CC'])
      .withMessage('Tipo de documento debe ser TI o CC'),
    body('id')
      .matches(/^\d{1,10}$/)
      .withMessage('ID debe contener solo números (máx 10 dígitos)'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage('Primer nombre requerido (máx 30 caracteres)')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Primer nombre solo puede contener letras'),
    body('secondName')
      .optional()
      .trim()
      .isLength({ max: 30 })
      .withMessage('Segundo nombre no puede superar los 30 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Segundo nombre solo puede contener letras'),
    body('lastName').optional().trim().isLength({ max: 30 }), // DEPRECATED: usar secondName
    body('surname')
      .trim()
      .isLength({ min: 1, max: 60 })
      .withMessage('Apellido requerido (máx 60 caracteres)')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Apellido solo pueden contener letras'),
    body('birthdate')
      .isISO8601()
      .toDate()
      .withMessage('Fecha de nacimiento inválida (formato: YYYY-MM-DD)'),
    body('gender')
      .isIn(['Masculino', 'Femenino', 'No binario', 'Prefiero no reportar'])
      .withMessage(
        'Género debe ser: Masculino, Femenino, No binario o Prefiero no reportar'
      ),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('phone')
      .matches(/^\d{10}$/)
      .withMessage('Teléfono debe tener 10 dígitos'),
    // photoUrl no se valida aquí porque viene del upload service, es opcional si no suben foto
  ],
  handleValidationErrors,
  createUser
);

/**
 * @route GET /user/users
 * @desc Listar todos los usuarios (paginado)
 * @access Protected
 * @query ?page=1&pageSize=20
 */
router.get('/users', validateEntraToken, listUsers);

/**
 * @route GET /user/:id
 * @desc Obtener usuario por documento
 * @access Protected
 */
router.get('/:id', validateEntraToken, getUserById);

/**
 * @route PATCH /user/:id
 * @desc Actualizar usuario
 * @access Protected
 */
router.patch(
  '/:id',
  validateEntraToken,
  upload.single('photo'),
  mongoSanitizer,
  sanitizeBody,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('phone')
      .optional()
      .matches(/^\d{10}$/),
    // photoUrl se maneja internamente
  ],
  handleValidationErrors,
  updateUser
);

/**
 * @route DELETE /user/:id
 * @desc Eliminar usuario (soft delete)
 * @access Admin only
 */
router.delete('/:id', validateEntraToken, requireAdmin, deleteUser);

module.exports = router;
