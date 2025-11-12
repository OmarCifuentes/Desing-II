const Log = require('./log.model');

async function createLog(req, res) {
  try {
    const { idnum, idType, accion, data } = req.body;
    
    const newLog = new Log({
      userID: idnum,
      idType: idType,
      action: accion,
      data: JSON.stringify(data)
    });

    await newLog.save();
    res.status(201).json({ message: 'Log creado exitosamente', log: newLog });
  } catch (error) {
    console.error('Error creando log:', error);
    res.status(500).json({ message: 'Error al crear log', error: error.message });
  }
}

async function getLog(req, res) {
  try {
    const { id: userID, dateFrom, dateTo, idType } = req.query;
    
    const filters = {};
    if (userID) filters.userID = userID;
    if (idType) filters.idType = idType;
    
    if (dateFrom || dateTo) {
      filters.time = {};
      if (dateFrom) filters.time.$gte = new Date(dateFrom);
      if (dateTo) filters.time.$lte = new Date(dateTo);
    }
    
    const logs = await Log.find(filters).sort({ time: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ message: 'Error al obtener logs', error: error.message });
  }
}

async function getLogById(req, res) {
  try {
    const { id } = req.params;
    
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: 'El ID debe contener solo números' });
    }
    
    const logs = await Log.find({ userID: id }).sort({ time: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ message: 'Error al obtener logs', error: error.message });
  }
}

module.exports = { createLog, getLog, getLogById };