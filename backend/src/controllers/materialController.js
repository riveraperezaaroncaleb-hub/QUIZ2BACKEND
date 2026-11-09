const { Material, Categoria } = require('../models');
const { calcularPuntoReorden, calcularStock, obtenerAlertasReorden } = require('../services/reordenService');
const createCrudController = require('./crudControllerFactory');

async function obtenerStock(req, res, next) {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado.' });
    }

    const stockActual = await calcularStock(material.id);
    const puntoReorden = calcularPuntoReorden(material);
    return res.json({
      materialId: material.id,
      codigo: material.codigo,
      nombre: material.nombre,
      unidad: material.unidad,
      stockActual,
      puntoReorden,
      estado: stockActual < puntoReorden ? 'REORDEN' : 'NORMAL',
    });
  } catch (error) {
    return next(error);
  }
}

async function listarAlertasReorden(req, res, next) {
  try {
    const alertas = await obtenerAlertasReorden();
    return res.json({ total: alertas.length, alertas });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  ...createCrudController(Material, {
    fields: [
      'codigo',
      'nombre',
      'unidad',
      'demandaDiaria',
      'tiempoEntregaDias',
      'stockSeguridad',
      'activo',
      'categoriaId',
    ],
    include: [{ model: Categoria }],
    order: [['nombre', 'ASC']],
  }),
  obtenerStock,
  listarAlertasReorden,
};
