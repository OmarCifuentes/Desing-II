const { Router } = require('express');
const { createUser, patchUser, deleteUser } = require('./user.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // 🆕 IMPORTAR

const router = Router();

// Crear usuario con foto (usa upload.single('photo'))
router.post('/', 
  authMiddleware, 
  upload.single('photo'),  // Middleware de subida
  createUser
);

router.patch('/:id', authMiddleware, patchUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;