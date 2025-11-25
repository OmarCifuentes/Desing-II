/**
 * INTENT CLASSIFIER
 * Clasifica la intención del usuario en la pregunta
 * Permite rutear a diferentes engines de consulta
 */

class IntentClassifier {
  /**
   * Clasificar intención de la pregunta
   * @returns {Object} {intent, confidence, extractedData}
   */
  classify(pregunta) {
    const preguntaLower = pregunta.toLowerCase();

    // Intent: Filtrar por género (MOVED UP - CHECK BEFORE COUNT)
    // Específico antes que genérico para mejor clasificación
    if (
      this.matchPattern(preguntaLower, [
        'masculino',
        'masculinos',
        'hombres',
        'varones',
        'femenino',
        'femeninos',
        'femeninas',
        'mujeres',
        'damas',
      ])
    ) {
      return {
        intent: 'FILTER_GENDER',
        confidence: 0.95,
        extractedData: { gender: this.extractGender(preguntaLower) },
      };
    }

    // Intent: Contar usuarios
    if (
      this.matchPattern(preguntaLower, [
        'cuántos',
        'cantidad',
        'total',
        'número de',
      ])
    ) {
      return {
        intent: 'COUNT',
        confidence: 0.9,
        extractedData: { entity: this.extractEntity(preguntaLower) },
      };
    }

    // Intent: Usuario más joven
    if (this.matchPattern(preguntaLower, ['joven', 'menor', 'más pequeño'])) {
      return {
        intent: 'YOUNGEST',
        confidence: 0.95,
        extractedData: {},
      };
    }

    // Intent: Usuario más mayor
    if (
      this.matchPattern(preguntaLower, [
        'mayor',
        'viejo',
        'más edad',
        'más grande',
      ])
    ) {
      return {
        intent: 'OLDEST',
        confidence: 0.95,
        extractedData: {},
      };
    }

    // Intent: Edad promedio
    if (this.matchPattern(preguntaLower, ['promedio', 'media', 'average'])) {
      return {
        intent: 'AVERAGE_AGE',
        confidence: 0.9,
        extractedData: {},
      };
    }

    // Intent: Listar todos
    if (
      this.matchPattern(preguntaLower, [
        'lista',
        'todos',
        'muestra',
        'cuáles son',
      ])
    ) {
      return {
        intent: 'LIST_ALL',
        confidence: 0.85,
        extractedData: {},
      };
    }

    // Intent: Buscar específico
    if (
      this.matchPattern(preguntaLower, [
        'quiénes',
        'busca',
        'encuentra',
        'dame info',
      ])
    ) {
      return {
        intent: 'SEARCH_SPECIFIC',
        confidence: 0.7,
        extractedData: { query: pregunta },
      };
    }

    // Intent desconocido - fallback a LLM
    return {
      intent: 'UNKNOWN',
      confidence: 0.0,
      extractedData: { query: pregunta },
    };
  }

  /**
   * Verificar si la pregunta contiene alguno de los patrones
   */
  matchPattern(text, patterns) {
    return patterns.some((pattern) => text.includes(pattern));
  }

  /**
   * Extraer entidad (usuarios, empleados, etc.)
   */
  extractEntity(text) {
    if (text.includes('usuario')) return 'usuarios';
    if (text.includes('empleado')) return 'empleados';
    if (text.includes('persona')) return 'personas';
    return 'usuarios';
  }

  /**
   * Extraer género mencionado
   */
  extractGender(text) {
    if (text.includes('masculino') || text.includes('hombres'))
      return 'Masculino';
    if (text.includes('femenino') || text.includes('mujeres'))
      return 'Femenino';
    return null;
  }
}

module.exports = new IntentClassifier();
