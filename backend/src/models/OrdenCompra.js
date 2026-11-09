const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenCompra = sequelize.define('OrdenCompra', {
  fechaOrden: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM('borrador', 'pendiente', 'recibida', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = OrdenCompra;
