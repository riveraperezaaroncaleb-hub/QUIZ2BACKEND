const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  codigo: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  unidad: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pieza',
  },
  demandaDiaria: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  tiempoEntregaDias: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  stockSeguridad: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = Material;
