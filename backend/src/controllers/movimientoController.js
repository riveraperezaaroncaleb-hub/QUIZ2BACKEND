const { Material, Movimiento } = require('../models');
const sequelize = require('../config/database');
const { calcularStock } = require('../services/reordenService');
const createCrudController = require('./crudControllerFactory');

async function registrarMovimiento(req, res, next) {
  const {
    materialId,
    tipo,
    cantidad,
    fechaMovimiento,
    ubicacionOrigen,
    ubicacionDestino,
    referencia,
    observaciones,
  } = req.body || {};

  if (!Number.isInteger(Number(materialId)) || Number(materialId) <= 0) {
    return res.status(400).json({ error: 'materialId debe ser un entero positivo.' });
  }
  if (!['entrada', 'salida', 'traslado'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser entrada, salida o traslado.' });
  }
  if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
    return res.status(400).json({ error: 'cantidad debe ser un número mayor que cero.' });
  }
  if (tipo === 'traslado' && (!ubicacionOrigen || !ubicacionDestino || ubicacionOrigen === ubicacionDestino)) {
    return res.status(400).json({
      error: 'Un traslado requiere ubicaciones de origen y destino diferentes.',
    });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const material = await Material.findByPk(materialId, { transaction });
      if (!material) {
        const error = new Error('Material no encontrado.');
        error.status = 404;
        throw error;
      }

      const stockAntes = await calcularStock(materialId, transaction);
      if (tipo === 'salida' && Number(cantidad) > stockAntes) {
        const error = new Error('Stock insuficiente para registrar la salida.');
        error.status = 409;
        error.stockActual = stockAntes;
        throw error;
      }

      const movimiento = await Movimiento.create({
        materialId: Number(materialId),
        tipo,
        cantidad: Number(cantidad),
        fechaMovimiento: fechaMovimiento || undefined,
        ubicacionOrigen,
        ubicacionDestino,
        referencia,
        observaciones,
      }, { transaction });

      const stockActual = await calcularStock(materialId, transaction);
      return { movimiento, stockActual };
    });

    return res.status(201).json(resultado);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'La referencia ya fue registrada.' });
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        ...(error.stockActual === undefined ? {} : { stockActual: error.stockActual }),
      });
    }
    return next(error);
  }
}

module.exports = {
  ...createCrudController(Movimiento, {
    include: [{ model: Material }],
    order: [['fechaMovimiento', 'DESC']],
  }),
  registrarMovimiento,
};
