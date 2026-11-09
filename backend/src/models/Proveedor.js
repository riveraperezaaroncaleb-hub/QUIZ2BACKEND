const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  contacto: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(40),
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true },
  },
});

module.exports = Proveedor;
