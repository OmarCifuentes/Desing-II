const axios = require('axios');
const { sanitizeLLMPrompt } = require('../../shared/middleware/inputSanitizer');

/**
 * LLM CLIENT
 * Cliente robusto para OpenRouter con retry, timeout y sanitización
 * Protección contra prompt injection
 */

class LLMClient {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model =
      process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.timeout = 30000; // 30 segundos
    this.maxRetries = 2;
  }

  /**
   *GenerarcompletaciónconLLM
   */
  async complete(prompt, context = null, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    //Sanitizarpromptparaprevenirinjection
    const sanitizedPrompt = sanitizeLLMPrompt(prompt);

    //Construirmensajedelsistema
    const systemMessage = this.buildSystemMessage();

    //Construirmensajedelusuario
    const userMessage = context
      ? this.buildPromptWithContext(sanitizedPrompt, context)
      : sanitizedPrompt;

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 250,
      top_p: 0.9,
    };

    return await this.makeRequestWithRetry(payload);
  }

  /**
   *Construirmensajedelsistema
   */
  buildSystemMessage() {
    return `Eres un asistente que responde preguntas sobre usuarios registrados en un sistema.

INSTRUCCIONES:
- Responde SOLO basándote en los datos proporcionados
- Sé conciso (máximo 150 caracteres)
- Usa español profesional
- Si la información no está disponible, indica "No tengo suficiente información"
- No inventes datos
- Si preguntan por "empleado", interpreta como "usuario"`;
  }

  /**
   *Construirpromptconcontexto
   */
  buildPromptWithContext(pregunta, context) {
    const contextString = JSON.stringify(context, null, 2);

    return `DATOS DISPONIBLES:
${contextString}

PREGUNTA: ${pregunta}

RESPUESTA (máximo 150 caracteres):`;
  }

  /**
   *Hacerrequestconretrylogic
   */
  async makeRequestWithRetry(payload, attempt = 1) {
    try {
      const response = await axios.post(this.baseURL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://user-query-service.local',
          'X-Title': 'UserQueryService',
        },
        timeout: this.timeout,
      });

      if (response.data?.choices?.length > 0) {
        return response.data.choices[0].message.content.trim();
      }

      throw new Error('No response from LLM');
    } catch (error) {
      console.error(`LLM request failed (attempt ${attempt}):`, error.message);

      // Retry lógica
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return await this.makeRequestWithRetry(payload, attempt + 1);
      }

      // Si fallan todos los intentos
      if (error.response?.status === 429) {
        throw new Error('Rate limit excedido en OpenRouter');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout al conectar con LLM');
      } else {
        throw new Error(`Error en LLM: ${error.message}`);
      }
    }
  }

  /**
   *Sleeputility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new LLMClient();
