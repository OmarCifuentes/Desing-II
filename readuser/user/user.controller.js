const User = require('./user.model');
const axios = require('axios');

// ==========================================
// FUNCIÓN 1: Listar todos los usuarios
// ==========================================
async function getUsers(req, res) {
  try {
    const users = await User.find({ isDeleted: false });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

// ==========================================
// FUNCIÓN 2: Obtener usuario por ID
// ==========================================
async function getUser(req, res) {
  try {
    const { id } = req.params;
    
    const users = await User.find({ id, isDeleted: false });
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = users[0];

    // Enviar log
    try {
      await axios.post('http://logs:8082/log/', {
        idnum: id,
        idType: user.idType,
        accion: 'Read',
        data: { id }
      }, { timeout: 3000 });
    } catch (logError) {
      console.warn('⚠️ Servicio de logs no disponible');
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}


// ==========================================
// FUNCIÓN 3:  Consulta RAG en lenguaje natural
// ==========================================
async function consultaRAG(req, res) {
  const { pregunta } = req.body;

  if (!pregunta) {
    return res.status(400).json({ error: 'La pregunta es requerida' });
  }

  try {
    // 1. Obtener todos los usuarios de la BD
    const usuarios = await User.find({ isDeleted: false }).lean();

    if (usuarios.length === 0) {
      return res.status(404).json({ 
        error: 'No hay usuarios registrados para consultar',
        respuesta: 'No hay datos disponibles'
      });
    }

    // 2. Preparar contexto con información calculada
    const contexto = usuarios.map(u => {
      const edad = calcularEdad(u.birthdate);
      return {
        nombre: `${u.firstName} ${u.lastName || ''} ${u.surname}`.trim(),
        documento: u.id,
        edad: edad,
        fechaNacimiento: u.birthdate?.toISOString().split('T')[0] || 'No especificada',
        genero: u.gender,
        email: u.email,
        telefono: u.phone
      };
    });

    // 3. Intentar responder con reglas (más rápido y confiable)
    const respuestaReglas = respuestaBasadaEnReglas(pregunta, contexto);
    
    if (respuestaReglas) {
      // Registrar log
      try {
        await axios.post('http://logs:8082/log/', {
          idnum: 'SISTEMA',
          idType: 'CC',
          accion: 'ConsultaRAG',
          data: { pregunta, respuesta: respuestaReglas, metodo: 'Reglas' }
        }, { timeout: 3000 });
      } catch (logError) {
        console.warn('⚠️ Servicio de logs no disponible');
      }

      return res.json({
        pregunta,
        respuesta: respuestaReglas,
        metodo: 'Reglas programadas',
        contexto: `Basado en ${contexto.length} usuario(s) registrado(s)`
      });
    }

    // 4. Si no hay regla, intentar con LLM
    const prompt = `Eres un asistente que responde preguntas sobre usuarios registrados.

DATOS DISPONIBLES:
${JSON.stringify(contexto, null, 2)}

PREGUNTA: ${pregunta}

INSTRUCCIONES:
- Responde SOLO con información de los datos
- Sé conciso (máximo 150 caracteres)
- Si preguntan por "empleado", refiere a "usuario"
- Usa español
- Si no puedes responder, di "No tengo información suficiente"

RESPUESTA:`;

    const data = JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [{ role: "user", content: prompt }]
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`
      },
      data: data
    };

    const response = await axios.request(config);

    if (response.data?.choices?.length) {
      const respuesta = response.data.choices[0].message.content.trim();

      // Registrar log
      try {
        await axios.post('http://logs:8082/log/', {
          idnum: 'SISTEMA',
          idType: 'CC',
          accion: 'ConsultaRAG',
          data: { pregunta, respuesta, metodo: 'OpenRouter AI' }
        }, { timeout: 3000 });
      } catch (logError) {
        console.warn('⚠️ Servicio de logs no disponible');
      }

      return res.json({ 
        pregunta,
        respuesta,
        metodo: 'OpenRouter AI'
      });
    }

    // Fallback final
    return res.json({
      pregunta,
      respuesta: 'No puedo procesar esa consulta en este momento',
      metodo: 'Sin respuesta'
    });

  } catch (error) {
    console.error('Error en consulta RAG:', error.message);
    return res.status(500).json({ 
      error: 'Error al procesar la consulta',
      pregunta
    });
  }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Calcular edad desde fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// Responder preguntas usando reglas programadas
function respuestaBasadaEnReglas(pregunta, contexto) {
  const preguntaLower = pregunta.toLowerCase();

  // Pregunta: ¿Quién es el más joven?
  if (preguntaLower.includes('joven') || preguntaLower.includes('menor edad')) {
    const masJoven = contexto.reduce((prev, curr) => 
      curr.edad < prev.edad ? curr : prev
    );
    return `${masJoven.nombre} (${masJoven.edad} años)`;
  }

  // Pregunta: ¿Quién es el mayor?
  if (preguntaLower.includes('mayor') || preguntaLower.includes('viejo') || preguntaLower.includes('más edad')) {
    const masMayor = contexto.reduce((prev, curr) => 
      curr.edad > prev.edad ? curr : prev
    );
    return `${masMayor.nombre} (${masMayor.edad} años)`;
  }

  // Pregunta: ¿Cuántos usuarios hay?
  if (preguntaLower.includes('total') || preguntaLower.includes('cuántos') || preguntaLower.includes('cantidad')) {
    return `Hay ${contexto.length} usuario${contexto.length !== 1 ? 's' : ''} registrado${contexto.length !== 1 ? 's' : ''}`;
  }

  // Pregunta: Edad promedio
  if (preguntaLower.includes('promedio') || preguntaLower.includes('media de edad')) {
    const edadPromedio = contexto.reduce((sum, u) => sum + u.edad, 0) / contexto.length;
    return `La edad promedio es ${Math.round(edadPromedio)} años`;
  }

  // Pregunta: Listar nombres
  if (preguntaLower.includes('lista') || preguntaLower.includes('nombres de todos')) {
    const nombres = contexto.map(u => u.nombre).join(', ');
    return nombres.length > 150 ? `${nombres.substring(0, 147)}...` : nombres;
  }

  // Pregunta: Buscar por género
  if (preguntaLower.includes('masculino') || preguntaLower.includes('hombres')) {
    const hombres = contexto.filter(u => u.genero === 'Masculino');
    return `Hay ${hombres.length} usuario${hombres.length !== 1 ? 's' : ''} masculino${hombres.length !== 1 ? 's' : ''}`;
  }

  if (preguntaLower.includes('femenino') || preguntaLower.includes('mujeres')) {
    const mujeres = contexto.filter(u => u.genero === 'Femenino');
    return `Hay ${mujeres.length} usuario${mujeres.length !== 1 ? 's' : ''} femenino${mujeres.length !== 1 ? 's' : ''}`;
  }

  // No hay regla que coincida
  return null;
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================
module.exports = { 
  getUsers, 
  getUser, 
  consultaRAG
};