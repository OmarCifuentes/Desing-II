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
      photoBase64 //  Recibir foto en Base64
    } = req.body;

    // Validar tamaño de la foto (opcional, ya lo hace el modelo)
    if (photoBase64) {
      const sizeInBytes = (photoBase64.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 2) {
        return res.status(400).json({ 
          error: 'La foto no debe superar los 2MB' 
        });
      }

      // Validar que sea una imagen válida (data:image/...)
      if (!photoBase64.startsWith('data:image/')) {
        return res.status(400).json({ 
          error: 'El formato de la imagen no es válido. Debe ser data:image/...' 
        });
      }
    }

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
      photoBase64 //  Guardar Base64 directamente
    });

    await newUser.save();

    // Enviar log (sin la foto para no saturar logs)
    try {
      await axios.post('http://logs:8082/log/', {
        idnum: id,
        idType: idType,
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

    // No devolver el Base64 completo en la respuesta (solo indicar si existe)
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