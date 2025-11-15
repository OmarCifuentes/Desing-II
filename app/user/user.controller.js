const User = require('./user.model');
const axios = require('axios');

const createUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      surname, 
      id, 
      idType, 
      email, 
      phone, 
      birthdate, 
      gender,
      photoBase64
    } = req.body;

    // =========================
    // VALIDACIONES
    // =========================

    // ID: solo números
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'ID inválido, solo números permitidos' });
    }

    // Nombre y apellidos: solo letras y espacios
    const nameFields = { firstName, lastName, surname };
    for (const [key, value] of Object.entries(nameFields)) {
      if (value && !/^[A-Za-z\s]+$/.test(value)) {
        return res.status(400).json({ error: `${key} inválido, no puede contener números` });
      }
    }

    // Teléfono: 10 dígitos
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Teléfono inválido, debe tener 10 dígitos' });
    }

    // Foto Base64 (opcional)
    if (photoBase64) {
      const sizeInBytes = (photoBase64.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      if (sizeInMB > 2) {
        return res.status(400).json({ error: 'La foto no debe superar los 2MB' });
      }
      if (!photoBase64.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Formato de imagen inválido, debe ser data:image/...' });
      }
    }

    // =========================
    // CREAR USUARIO
    // =========================
    const newUser = new User({
      firstName,
      lastName,
      surname,
      id,
      idType,
      email,
      phone,
      birthdate,
      gender,
      photoBase64
    });

    await newUser.save();

    // =========================
    // ENVIAR LOG (sin la foto)
    // =========================
    try {
      await axios.post('http://logs:8082/log/', {
        idnum: id,
        idType,
        accion: 'Created',
        data: { 
          firstName, 
          lastName, 
          surname, 
          id, 
          idType, 
          email, 
          phone, 
          birthdate, 
          gender,
          tieneFoto: !!photoBase64
        }
      }, { timeout: 3000 });
    } catch (logError) {
      console.warn('⚠️ Servicio de logs no disponible');
    }

    // =========================
    // RESPUESTA
    // =========================
    const userResponse = newUser.toObject();
    if (userResponse.photoBase64) {
      userResponse.photoBase64 = `[Imagen de ${(userResponse.photoBase64.length / 1024).toFixed(2)} KB]`;
    }

    res.status(201).json({ 
      message: 'Usuario creado con éxito', 
      data: userResponse 
    });

  } catch (error) {
    console.error(error);

    // Capturar errores de duplicado (MongoDB)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} ya está registrado` });
    }

    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

const patchUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findOne({ id, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();

    // Enviar log
    try {
      await axios.post('http://logs:8082/log/', {
        idnum: id,
        idType: user.idType,
        accion: 'Modified',
        data: updates
      }, { timeout: 3000 });
    } catch (logError) {
      console.warn('⚠️ Servicio de logs no disponible');
    }

    res.status(200).json({ message: 'Usuario modificado con éxito', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al modificar el usuario' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.isDeleted = true;
    await user.save();

    // Enviar log
    try {
      await axios.post('http://logs:8082/log/', {
        idnum: id,
        idType: user.idType,
        accion: 'Deleted',
        data: { id }
      }, { timeout: 3000 });
    } catch (logError) {
      console.warn('⚠️ Servicio de logs no disponible');
    }

    res.status(200).json({ message: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

module.exports = { createUser, patchUser, deleteUser };
