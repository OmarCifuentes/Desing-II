const userService = require('../services/user.service');
const photoUploadService = require('../services/photoUpload.service');

/**
 * USER CONTROLLER
 * Manejo de HTTP - delega lógica de negocio al servicio
 * Solo responsable de:
 * - Extraer datos de req
 * - Llamar al servicio
 * - Formatear respuesta HTTP
 */

/**
 * Crear usuario
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const requestMeta = extractRequestMeta(req);

    // Manejo de foto (si existe)
    if (req.file) {
      try {
        // Inicializar servicio (idempotente)
        await photoUploadService.initialize();

        const uploadResult = await photoUploadService.uploadPhoto(
          req.file.buffer,
          userData.id,
          req.file.mimetype
        );
        userData.photoUrl = uploadResult.photoUrl;
      } catch (uploadError) {
        // Si falla la subida, retornamos error 400
        const error = new Error(`Error subiendo foto: ${uploadError.message}`);
        error.status = 400;
        throw error;
      }
    }

    const user = await userService.createUser(userData, requestMeta);

    res.status(201).json({
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario por ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestMeta = extractRequestMeta(req);

    const user = await userService.getUserByDocument(id, requestMeta);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Listar usuarios
 */
const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const requestMeta = extractRequestMeta(req);

    const result = await userService.listUsers(page, pageSize, requestMeta);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario
 */
/**
 * Actualizar usuario
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const requestMeta = extractRequestMeta(req);

    // Manejo de foto (si existe)
    if (req.file) {
      try {
        await photoUploadService.initialize();

        const uploadResult = await photoUploadService.uploadPhoto(
          req.file.buffer,
          id,
          req.file.mimetype
        );
        updates.photoUrl = uploadResult.photoUrl;
      } catch (uploadError) {
        const error = new Error(`Error subiendo foto: ${uploadError.message}`);
        error.status = 400;
        throw error;
      }
    }

    const user = await userService.updateUser(id, updates, requestMeta);

    res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar usuario
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user?.oid || 'SISTEMA';
    const requestMeta = extractRequestMeta(req);

    const result = await userService.deleteUser(id, deletedBy, requestMeta);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Utilidad: Extraer metadata del request
 */
function extractRequestMeta(req) {
  return {
    requestId: req.id,
    httpMethod: req.method,
    httpStatus: 200,
    endpoint: req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    userEmail: req.user?.email || null,
    idType: req.user ? 'ENTRA_OID' : 'CC',
  };
}

module.exports = {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
};
