const { Router } = require('express');
const { register, login, verifyToken } = require('./auth.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;