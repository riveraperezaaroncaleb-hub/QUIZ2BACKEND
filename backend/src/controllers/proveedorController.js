const { Proveedor } = require('../models');
const createCrudController = require('./crudControllerFactory');

module.exports = createCrudController(Proveedor, {
  fields: ['nombre', 'contacto', 'telefono', 'correo'],
  include: [{ association: 'OrdenCompras' }],
  order: [['nombre', 'ASC']],
});
