const { DetalleOC, Material, OrdenCompra } = require('../models');
const createCrudController = require('./crudControllerFactory');

module.exports = createCrudController(DetalleOC, {
  fields: ['materialId', 'cantidad', 'precioUnitario'],
  include: [{ model: Material }],
  order: [['id', 'ASC']],
  parentParam: 'ordenCompraId',
  parentForeignKey: 'ordenCompraId',
  parentModel: OrdenCompra,
});
