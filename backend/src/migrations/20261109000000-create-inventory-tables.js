'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('Proveedors', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      contacto: { type: Sequelize.STRING(150), allowNull: true },
      telefono: { type: Sequelize.STRING(40), allowNull: true },
      correo: { type: Sequelize.STRING(150), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('Materials', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      unidad: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'pieza' },
      demandaDiaria: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      tiempoEntregaDias: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      stockSeguridad: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      categoriaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Categoria', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });

    await queryInterface.createTable('OrdenCompras', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      fechaOrden: { type: Sequelize.DATE, allowNull: false },
      estado: {
        type: Sequelize.ENUM('borrador', 'pendiente', 'recibida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      proveedorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Proveedors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.createTable('DetalleOCs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      cantidad: { type: Sequelize.FLOAT, allowNull: false },
      precioUnitario: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      ordenCompraId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'OrdenCompras', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      materialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Materials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.createTable('Movimientos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      tipo: { type: Sequelize.ENUM('entrada', 'salida', 'traslado'), allowNull: false },
      cantidad: { type: Sequelize.FLOAT, allowNull: false },
      fechaMovimiento: { type: Sequelize.DATE, allowNull: false },
      ubicacionOrigen: { type: Sequelize.STRING(100), allowNull: true },
      ubicacionDestino: { type: Sequelize.STRING(100), allowNull: true },
      referencia: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      materialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Materials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Movimientos');
    await queryInterface.dropTable('DetalleOCs');
    await queryInterface.dropTable('OrdenCompras');
    await queryInterface.dropTable('Materials');
    await queryInterface.dropTable('Proveedors');
    await queryInterface.dropTable('Categoria');
  },
};
