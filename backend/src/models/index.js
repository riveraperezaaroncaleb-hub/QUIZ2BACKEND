const Categoria = require('./Categoria');
const Material = require('./Material');
const Proveedor = require('./Proveedor');
const OrdenCompra = require('./OrdenCompra');
const DetalleOC = require('./DetalleOC');
const Movimiento = require('./Movimiento');
const Usuario = require('./Usuario');

Categoria.hasMany(Material, { foreignKey: { name: 'categoriaId', allowNull: true } });
Material.belongsTo(Categoria, { foreignKey: 'categoriaId' });

Proveedor.hasMany(OrdenCompra, { foreignKey: { name: 'proveedorId', allowNull: false } });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedorId' });

OrdenCompra.hasMany(DetalleOC, {
  as: 'detalles',
  foreignKey: { name: 'ordenCompraId', allowNull: false },
  onDelete: 'CASCADE',
});
DetalleOC.belongsTo(OrdenCompra, { foreignKey: 'ordenCompraId' });

Material.hasMany(DetalleOC, { foreignKey: { name: 'materialId', allowNull: false } });
DetalleOC.belongsTo(Material, { foreignKey: 'materialId' });

Material.hasMany(Movimiento, {
  as: 'movimientos',
  foreignKey: { name: 'materialId', allowNull: false },
});
Movimiento.belongsTo(Material, { foreignKey: 'materialId' });

module.exports = {
  Categoria,
  Material,
  Proveedor,
  OrdenCompra,
  DetalleOC,
  Movimiento,
  Usuario,
};
