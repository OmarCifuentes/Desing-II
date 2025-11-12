const { Router } = require('express');
const { getUsers, getUser, consultaRAG } = require('./user.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.get('/users', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUser);
router.post('/consulta', authMiddleware, consultaRAG); // Solo RAG

module.exports = router;