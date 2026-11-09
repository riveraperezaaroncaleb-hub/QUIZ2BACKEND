const { Categoria } = require('../models');
const createCrudController = require('./crudControllerFactory');

module.exports = createCrudController(Categoria, {
  fields: ['nombre', 'descripcion'],
  include: [{ association: 'Materials' }],
  order: [['nombre', 'ASC']],
});
