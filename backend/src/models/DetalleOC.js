const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleOC = sequelize.define('DetalleOC', {
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0.000001 },
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
});

module.exports = DetalleOC;
