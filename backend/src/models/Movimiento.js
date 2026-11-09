const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Movimiento = sequelize.define('Movimiento', {
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida', 'traslado'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0.000001 },
  },
  fechaMovimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  ubicacionOrigen: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ubicacionDestino: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Movimiento;
