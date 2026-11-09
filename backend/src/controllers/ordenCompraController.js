const { OrdenCompra, Proveedor, DetalleOC, Material } = require('../models');
const sequelize = require('../config/database');
const { detectarOrdenesDuplicadas } = require('../services/duplicadosService');
const createCrudController = require('./crudControllerFactory');

const include = [
  { model: Proveedor },
  { association: 'detalles', include: [{ model: Material }] },
];

const crud = createCrudController(OrdenCompra, {
  fields: ['proveedorId', 'fechaOrden', 'estado', 'observaciones'],
  include,
  order: [['fechaOrden', 'DESC']],
});

async function crear(req, res, next) {
  const { proveedorId, fechaOrden, estado, observaciones, detalles } = req.body || {};
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'La orden debe incluir al menos un detalle.' });
  }
  if (detalles.some((detalle) => (
    !detalle
    || typeof detalle !== 'object'
    || Array.isArray(detalle)
    || !Number.isInteger(Number(detalle.materialId))
    || Number(detalle.materialId) <= 0
    || !Number.isFinite(Number(detalle.cantidad))
    || Number(detalle.cantidad) <= 0
    || (detalle.precioUnitario !== undefined
      && (!Number.isFinite(Number(detalle.precioUnitario)) || Number(detalle.precioUnitario) < 0))
  ))) {
    return res.status(400).json({
      error: 'Cada detalle requiere materialId válido, cantidad mayor que cero y precio no negativo.',
    });
  }

  try {
    const orden = await sequelize.transaction(async (transaction) => {
      const nuevaOrden = await OrdenCompra.create(
        { proveedorId, fechaOrden, estado, observaciones },
        { transaction },
      );
      await DetalleOC.bulkCreate(
        detalles.map(({ materialId, cantidad, precioUnitario }) => ({
          ordenCompraId: nuevaOrden.id,
          materialId,
          cantidad: Number(cantidad),
          precioUnitario: precioUnitario === undefined ? 0 : Number(precioUnitario),
        })),
        { transaction, validate: true },
      );
      return OrdenCompra.findByPk(nuevaOrden.id, { include, transaction });
    });
    return res.status(201).json(orden);
  } catch (error) {
    return next(error);
  }
}

async function listarPosiblesDuplicados(req, res, next) {
  try {
    const duplicados = await detectarOrdenesDuplicadas();
    return res.json({ total: duplicados.length, duplicados });
  } catch (error) {
    return next(error);
  }
}

module.exports = { ...crud, crear, listarPosiblesDuplicados };
