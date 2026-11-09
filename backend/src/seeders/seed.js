require('dotenv').config();
const sequelize = require('../config/database');
const { Categoria, Material, Proveedor, Movimiento } = require('../models');

const materialesIniciales = [
  {
    codigo: 'CEM-50',
    nombre: 'Cemento 50kg',
    unidad: 'saco',
    demandaDiaria: 20,
    tiempoEntregaDias: 3,
    stockSeguridad: 20,
    stockInicial: 100,
  },
  {
    codigo: 'VAR-3',
    nombre: 'Varilla #3',
    unidad: 'pieza',
    demandaDiaria: 30,
    tiempoEntregaDias: 4,
    stockSeguridad: 30,
    stockInicial: 160,
  },
  {
    codigo: 'BLK-12',
    nombre: 'Block 12x20x40',
    unidad: 'pieza',
    demandaDiaria: 100,
    tiempoEntregaDias: 2,
    stockSeguridad: 100,
    stockInicial: 500,
  },
  {
    codigo: 'ARE-01',
    nombre: 'Arena',
    unidad: 'm3',
    demandaDiaria: 5,
    tiempoEntregaDias: 2,
    stockSeguridad: 10,
    stockInicial: 30,
  },
];

async function seed() {
  await sequelize.authenticate();
  const [construccion] = await Categoria.findOrCreate({
    where: { nombre: 'Materiales de construcción' },
    defaults: { descripcion: 'Materiales para obra y construcción.' },
  });
  await Proveedor.findOrCreate({
    where: { nombre: 'Proveedor general' },
    defaults: { contacto: 'Área de ventas' },
  });

  for (const item of materialesIniciales) {
    const [material] = await Material.findOrCreate({
      where: { codigo: item.codigo },
      defaults: {
        nombre: item.nombre,
        unidad: item.unidad,
        demandaDiaria: item.demandaDiaria,
        tiempoEntregaDias: item.tiempoEntregaDias,
        stockSeguridad: item.stockSeguridad,
        categoriaId: construccion.id,
      },
    });

    await Movimiento.findOrCreate({
      where: { referencia: `SEED-INICIAL-${item.codigo}` },
      defaults: {
        materialId: material.id,
        tipo: 'entrada',
        cantidad: item.stockInicial,
        observaciones: 'Existencia inicial cargada por el seed.',
      },
    });
  }
}

seed()
  .then(async () => {
    console.log('Datos iniciales cargados correctamente.');
    await sequelize.close();
  })
  .catch(async (error) => {
    console.error('Error al cargar los datos iniciales:', error);
    await sequelize.close();
    process.exitCode = 1;
  });
