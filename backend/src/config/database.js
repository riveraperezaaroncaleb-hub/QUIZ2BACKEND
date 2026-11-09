const { Sequelize } = require('sequelize');
const configurations = require('../../config/config');

const { username, password, database, ...options } = configurations[
  process.env.NODE_ENV || 'development'
];
const sequelize = new Sequelize(database, username, password, options);

module.exports = sequelize;
