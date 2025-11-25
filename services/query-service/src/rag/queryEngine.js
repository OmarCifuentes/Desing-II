const User = require('../../shared/models/User.model');

/**
 * QUERY ENGINE
 * Ejecuta queries específicas a MongoDB basadas en intención
 * Retorna contexto estructurado para LLM o respuesta directa
 */

class QueryEngine {
  /**
   * Ejecutar query según intención clasificada
   */
  async executeQuery(intent, extractedData = {}) {
    switch (intent) {
      case 'COUNT':
        return await this.countUsers(extractedData);

      case 'YOUNGEST':
        return await this.getYoungest();

      case 'OLDEST':
        return await this.getOldest();

      case 'AVERAGE_AGE':
        return await this.getAverageAge();

      case 'LIST_ALL':
        return await this.listAllUsers();

      case 'FILTER_GENDER':
        return await this.filterByGender(extractedData.gender);

      case 'SEARCH_SPECIFIC':
      case 'UNKNOWN':
        return await this.getAllUsersContext();

      default:
        return await this.getAllUsersContext();
    }
  }

  /**
   * Contar usuarios
   */
  async countUsers(extractedData) {
    const count = await User.countDocuments({ isDeleted: false });
    const entity = extractedData.entity || 'usuarios';

    return {
      directAnswer: `Hay ${count} ${entity} registrado${count !== 1 ? 's' : ''}`,
      context: { count, entity },
      needsLLM: false,
    };
  }

  /**
   * Obtener usuario más joven
   */
  async getYoungest() {
    // Optimización: Usar sort y limit en BD en lugar de procesar en memoria
    const youngest = await User
      .findOne({ isDeleted: false })
      .sort({ birthdate: -1 }) // Fecha más reciente = más joven
      .lean();

    if (!youngest) {
      return { directAnswer: 'No hay usuarios registrados', needsLLM: false };
    }

    const age = this.calculateAge(youngest.birthdate);
    const name =
      `${youngest.firstName} ${youngest.lastName || ''} ${youngest.surname}`.trim();

    return {
      directAnswer: `${name} (${age} años)`,
      context: { name, age, user: youngest },
      needsLLM: false,
    };
  }

  /**
   * Obtener usuario más mayor
   */
  async getOldest() {
    // Optimización: Usar sort y limit en BD
    const oldest = await User
      .findOne({ isDeleted: false })
      .sort({ birthdate: 1 }) // Fecha más antigua = más viejo
      .lean();

    if (!oldest) {
      return { directAnswer: 'No hay usuarios registrados', needsLLM: false };
    }

    const age = this.calculateAge(oldest.birthdate);
    const name =
      `${oldest.firstName} ${oldest.lastName || ''} ${oldest.surname}`.trim();

    return {
      directAnswer: `${name} (${age} años)`,
      context: { name, age, user: oldest },
      needsLLM: false,
    };
  }

  /**
   * Calcular edad promedio
   */
  async getAverageAge() {
    const users = await User.find({ isDeleted: false }).lean();

    if (users.length === 0) {
      return { directAnswer: 'No hay usuarios registrados', needsLLM: false };
    }

    const ages = users.map((u) => this.calculateAge(u.birthdate));
    const average = ages.reduce((sum, age) => sum + age, 0) / ages.length;

    return {
      directAnswer: `La edad promedio es ${Math.round(average)} años`,
      context: { average: Math.round(average), count: users.length },
      needsLLM: false,
    };
  }

  /**
   * Listar todos los usuarios
   */
  async listAllUsers() {
    const users = await User
      .find({ isDeleted: false })
      .select('firstName lastName surname')
      .limit(50)
      .lean();

    if (users.length === 0) {
      return { directAnswer: 'No hay usuarios registrados', needsLLM: false };
    }

    const names = users.map((u) => `${u.firstName} ${u.surname}`).join(', ');
    const truncated =
      names.length > 200 ? `${names.substring(0, 197)}...` : names;

    return {
      directAnswer: truncated,
      context: { count: users.length, names: users },
      needsLLM: false,
    };
  }

  /**
   * Filtrar por género
   */
  async filterByGender(gender) {
    if (!gender) {
      return await this.getAllUsersContext();
    }

    const count = await User.countDocuments({ gender, isDeleted: false });

    return {
      directAnswer: `Hay ${count} usuario${count !== 1 ? 's' : ''} ${gender.toLowerCase()}${count !== 1 ? 's' : ''}`,
      context: { gender, count },
      needsLLM: false,
    };
  }

  /**
   * Obtener contexto completo para LLM
   */
  async getAllUsersContext() {
    const users = await User
      .find({ isDeleted: false })
      .select('firstName lastName surname birthdate gender email phone id')
      .limit(100)
      .lean();

    const context = users.map((u) => ({
      nombre: `${u.firstName} ${u.lastName || ''} ${u.surname}`.trim(),
      documento: u.id,
      edad: this.calculateAge(u.birthdate),
      genero: u.gender,
      email: u.email,
    }));

    return {
      directAnswer: null,
      context,
      needsLLM: true,
    };
  }

  /**
   * Calcular edad
   */
  calculateAge(birthdate) {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }
}

module.exports = new QueryEngine();
