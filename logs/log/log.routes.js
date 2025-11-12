const { Router } = require('express');
const { createLog, getLog, getLogById } = require('./log.controller');

const router = Router();

router.post('/', createLog);
router.get('/', getLog);
router.get('/:id', getLogById);

module.exports = router;