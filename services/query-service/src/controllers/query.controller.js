const intentClassifier = require('../rag/intentClassifier');
const queryEngine = require('../rag/queryEngine');
const llmClient = require

  ('../rag/llmClient');
const { createLogger } = require('../../shared/utils/logger');

const logger = createLogger('query-service');

/**
 * QUERY CONTROLLER
 * Orquesta el pipeline RAG modular:
 * 1. Clasificar intención
 * 2. Ejecutar query específica
 * 3. Si necesita LLM, consultar
 * 4. Formatear y retornar respuesta
 */

/**
 * Consulta RAG
 */
const consultaRAG = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({
        error: 'Validation Error',
        details: [{ field: 'pregunta', message: 'La pregunta es requerida' }],
      });
    }

    // PASO 1: Clasificar intención
    const classification = intentClassifier.classify(pregunta);

    // PASO 2: Ejecutar query basada en intención
    const queryResult = await queryEngine.executeQuery(
      classification.intent,
      classification.extractedData
    );

    let respuesta;
    let metodo;

    // PASO 3: ¿Necesita LLM?
    if (queryResult.needsLLM) {
      // Usar LLM con contexto
      respuesta = await llmClient.complete(pregunta, queryResult.context);
      metodo = 'OpenRouter AI';
    } else {
      // Respuesta directa del query engine
      respuesta = queryResult.directAnswer;
      metodo = 'Query Engine';
    }

    // PASO 4: Log de auditoría
    await logger.logRAGQuery(
      req.user?.oid || 'ANONIMO',
      pregunta,
      respuesta,
      metodo,
      {
        requestId: req.id,
        httpMethod: req.method,
        endpoint: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        userEmail: req.user?.email || null,
        duration: Date.now() - startTime,
      }
    );

    // PASO 5: Respuesta
    res.status(200).json({
      pregunta,
      respuesta,
      metodo,
      inteligencia: {
        intent: classification.intent,
        confidence: classification.confidence,
      },
      ...(queryResult.context && {
        contexto: `Basado en ${JSON.stringify(queryResult.context).substring(0, 100)}...`,
      }),
    });
  } catch (error) {
    console.error('Error en consulta RAG:', error);
    await logger.logError(req.user?.oid || 'ANONIMO', error, {
      requestId: req.id,
      endpoint: req.originalUrl,
    });
    next(error);
  }
};

/**
 * Obtener usuario por documento
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const User = require('../../shared/models/User.model');
    const user = await User.findByDocument(id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado',
      });
    }

    await logger.logRead(
      id,
      { documentId: id },
      {
        requestId: req.id,
        httpMethod: req.method,
        endpoint: req.originalUrl,
      }
    );

    res.status(200).json(user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

/**
 * Listar usuarios
 */
const listUsers = async (req, res, next) => {
  try {
    const User = require('../../shared/models/User.model');
    const users = await User.findActive();

    res.status(200).json(users.map((u) => u.toSafeObject()));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  consultaRAG,
  getUserById,
  listUsers,
};
