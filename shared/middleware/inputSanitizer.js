const mongoSanitize = require('express-mongo-sanitize');
const { body, validationResult } = require('express-validator');

/**
 *INPUTSANITIZATIONMIDDLEWARE
 *Protege contra NoSQL injection,XSS y otros ataques deinyección
 */

/**
 *Sanitización de MongoDB
 *Remueve caracteres especiales$y.deinputsquepodríanusarseparainyección
 */
const mongoSanitizer = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential NoSQL injection attempt detected in ${key}`);
    },
});

/**
 *Sanitización de strings para prevenir XSS
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    return str
        .replace(/[<>]/g, '') //Remover <y>
        .trim();
};

/**
 *Middleware para sanitizar body
 */
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }
    next();
};

/**
 *Middleware para sanitizar query params
 */
const sanitizeQuery = (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach((key) => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        });
    }
    next();
};

/**
 *Validador para prevenir prompt injection en consultas LLM
 */
const sanitizeLLMPrompt = (prompt) => {
    if (typeof prompt !== 'string') return '';

    //Listado de patrones sospechosos
    const suspiciousPatterns = [
        /ignore\s+previous\s+instructions/i,
        /you\s+are\s+now/i,
        /system\s*:/i,
        /role\s*:\s*system/i,
        /<\|.*?\|>/g, //Special tokens
        /\[INST\]/i,
        /\[\/INST\]/i,
    ];

    let sanitized = prompt;

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitized)) {
            console.warn('Potential prompt injection detected');
            sanitized = sanitized.replace(pattern, '');
        }
    }

    //Limitar longitud para prevenir ataques de recursos
    const maxLength = 1000;
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized.trim();
};

/**
 *Middleware de validación de errores   
 *Usar después de express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'ValidationError',
            details: errors.array().map((err) => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value,
            })),
        });
    }

    next();
};

module.exports = {
    mongoSanitizer,
    sanitizeBody,
    sanitizeQuery,
    sanitizeString,
    sanitizeLLMPrompt,
    handleValidationErrors,
};
