const User = require('../../shared/models/User.model');

/**
 * USER REPOSITORY
 * Capa de acceso a datos - única responsabilidad: interactuar con MongoDB
 * Aplica Repository Pattern
 */

class UserRepository {
  /**
   * Crear usuario
   */
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Buscar usuario por documento
   */
  async findByDocument(documentId) {
    return await User.findByDocument(documentId);
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email) {
    return await User.findOne({ email, isDeleted: false });
  }

  /**
   * Buscar todos los usuarios activos
   */
  async findAllActive(options = {}) {
    const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;

    return await User
      .find({ isDeleted: false })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Actualizar usuario
   */
  async update(documentId, updates) {
    const user = await this.findByDocument(documentId);

    if (!user) {
      return null;
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'idType') {
        user[key] = updates[key];
      }
    });

    return await user.save();
  }

  /**
   * Soft delete
   */
  async softDelete(documentId, deletedBy) {
    const user = await this.findByDocument(documentId);

    if (!user) {
      return null;
    }

    return await user.softDelete(deletedBy);
  }

  /**
   * Contar usuarios activos
   */
  async countActive() {
    return await User.countDocuments({ isDeleted: false });
  }

  /**
   * Buscar con paginación
   */
  async findWithPagination(page = 1, pageSize = 20, filters = {}) {
    const skip = (page - 1) * pageSize;
    const query = { isDeleted: false, ...filters };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(skip)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

module.exports = new UserRepository();
