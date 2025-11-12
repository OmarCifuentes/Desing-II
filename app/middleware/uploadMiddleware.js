const multer = require('multer');
const path = require('path');

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Carpeta donde se guardan las fotos
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp + documento + extensión
    const uniqueName = `${Date.now()}-${req.body.id}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para validar tipo de archivo
const fileFilter = (req, file, cb) => {
  // Solo permitir imágenes
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif)'));
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB máximo
  },
  fileFilter: fileFilter
});

module.exports = upload;