const userRepository = require('../repositories/user.repository');
const { publishEvent } = require('../events/eventPublisher');
const { createLogger } = require('../../shared/utils/logger');

const logger = createLogger('user-crud-service');

/**
 * USER SERVICE
 * Lógica de negocio pura - orquestar repository y eventos
 * Aplica Service Layer Pattern
 */

class UserService {
    /**
     * Crear usuario
     */
    async createUser(userData, requestMeta = {}) {
        const startTime = Date.now();

        try {
            // Crear usuario en BD
            const user = await userRepository.create(userData);

            // Publicar evento asíncrono
            await publishEvent('created', {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
            });

            // Log de auditoría
            await logger.logCreate(
                user.id,
                {
                    ...userData,
                    photoUrl: userData.photoUrl ? 'uploaded' : null,
                },
                {
                    ...requestMeta,
                    duration: Date.now() - startTime,
                }
            );

            return user.toSafeObject();
        } catch (error) {
            await logger.logError(userData.id || 'unknown', error, requestMeta);
            throw error;
        }
    }

    /**
     * Obtener usuario por documento
     */
    async getUserByDocument(documentId, requestMeta = {}) {
        const startTime = Date.now();

        try {
            const user = await userRepository.findByDocument(documentId);

            if (!user) {
                const error = new Error('Usuario no encontrado');
                error.status = 404;
                throw error;
            }

            // Log de lectura
            await logger.logRead(
                documentId,
                { documentId },
                {
                    ...requestMeta,
                    duration: Date.now() - startTime,
                }
            );

            return user.toSafeObject();
        } catch (error) {
            await logger.logError(documentId, error, requestMeta);
            throw error;
        }
    }

    /**
     * Listar usuarios con paginación
     */
    async listUsers(page = 1, pageSize = 20, requestMeta = {}) {
        try {
            const result = await userRepository.findWithPagination(page, pageSize);
            return result;
        } catch (error) {
            await logger.logError('SISTEMA', error, requestMeta);
            throw error;
        }
    }

    /**
     * Actualizar usuario
     */
    async updateUser(documentId, updates, requestMeta = {}) {
        const startTime = Date.now();

        try {
            const user = await userRepository.update(documentId, updates);

            if (!user) {
                const error = new Error('Usuario no encontrado');
                error.status = 404;
                throw error;
            }

            // Publicar evento
            await publishEvent('updated', {
                id: user.id,
                updates: Object.keys(updates),
            });

            // Log de auditoría
            await logger.logUpdate(documentId, updates, {
                ...requestMeta,
                duration: Date.now() - startTime,
            });

            return user.toSafeObject();
        } catch (error) {
            await logger.logError(documentId, error, requestMeta);
            throw error;
        }
    }

    /**
     * Eliminar usuario (soft delete)
     */
    async deleteUser(documentId, deletedBy, requestMeta = {}) {
        const startTime = Date.now();

        try {
            const user = await userRepository.softDelete(documentId, deletedBy);

            if (!user) {
                const error = new Error('Usuario no encontrado');
                error.status = 404;
                throw error;
            }

            // Publicar evento
            await publishEvent('deleted', {
                id: user.id,
                deletedBy,
            });

            // Log de auditoría
            await logger.logDelete(
                documentId,
                { deletedBy },
                {
                    ...requestMeta,
                    duration: Date.now() - startTime,
                }
            );

            return { message: 'Usuario eliminado exitosamente' };
        } catch (error) {
            await logger.logError(documentId, error, requestMeta);
            throw error;
        }
    }
}

module.exports = new UserService();
