const express = require('express');
const {
  createLog,
  getLogs,
  getLogsByUser,
  getLogsByRequestId,
  getErrors,
} = require('../controllers/log.controller');
const {
  validateEntraToken,
} = require('../../shared/middleware/validateEntraToken');

const router = express.Router();

/**
 *@routePOST/log
 *@descCrearlog(usadoporeventosodirecto)
 *@accessPublic(usadointernamenteporservicios)
 */
router.post('/', createLog);

/**
 *@routeGET/log
 *@descObtenerlogsconfiltros
 *@accessProtected
 *@query?id=123&idType=CC&dateFrom=2024-01-01&dateTo=2024-12-31&severity=error&action=Created
 */
router.get('/', validateEntraToken, getLogs);

/**
 *@routeGET/log/user/:id
 *@descObtenerlogsdeunusuarioespecífico
 *@accessProtected
 */
router.get('/user/:id', validateEntraToken, getLogsByUser);

/**
 *@routeGET/log/request/:requestId
 *@descObtenerlogsporrequestId(correlación)
 *@accessProtected
 */
router.get('/request/:requestId', validateEntraToken, getLogsByRequestId);

/**
 *@routeGET/log/errors
 *@descObtenererroresrecientes
 *@accessProtected
 */
router.get('/errors', validateEntraToken, getErrors);

module.exports = router;
