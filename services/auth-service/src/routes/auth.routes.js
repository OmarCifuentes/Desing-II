const express = require('express');
const {
  login,
  callback,
  refresh,
  logout,
  verify,
} = require('../controllers/auth.controller');
const {
  validateEntraToken,
} = require('../../shared/middleware/validateEntraToken');
const { authLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

/**
 *@routeGET/auth/login
 *@descIniciarflujodeautenticaciónOAuth2
 *@accessPublic
 */
router.get('/login', login);

/**
 *@routeGET/auth/callback
 *@descCallbackdeMicrosoftEntraID
 *@accessPublic
 */
router.get('/callback', callback);

/**
 *@routePOST/auth/refresh
 *@descRenovaraccesstoken
 *@accessPublic
 */
router.post('/refresh', authLimiter, refresh);

/**
 *@routePOST/auth/logout
 *@descCerrarsesión
 *@accessPublic
 */
router.post('/logout', logout);

/**
 *@routeGET/auth/verify
 *@descVerificarqueaccesstokenesválido
 *@accessProtected
 */
router.get('/verify', validateEntraToken, verify);

module.exports = router;
