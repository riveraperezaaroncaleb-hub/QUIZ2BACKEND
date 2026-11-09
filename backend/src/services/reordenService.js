const { Op } = require('sequelize');
const { Material, Movimiento } = require('../models');

function calcularPuntoReorden(material) {
  return Number(material.demandaDiaria) * Number(material.tiempoEntregaDias)
    + Number(material.stockSeguridad);
}

async function calcularStock(materialId, transaction) {
  const movimientos = await Movimiento.findAll({
    where: { materialId },
    attributes: ['tipo', 'cantidad'],
    transaction,
  });

  return movimientos.reduce((stock, movimiento) => {
    if (movimiento.tipo === 'entrada') return stock + Number(movimiento.cantidad);
    if (movimiento.tipo === 'salida') return stock - Number(movimiento.cantidad);
    return stock;
  }, 0);
}

async function obtenerEstadoReorden(material) {
  const stockActual = await calcularStock(material.id);
  const puntoReorden = calcularPuntoReorden(material);

  return {
    materialId: material.id,
    codigo: material.codigo,
    nombre: material.nombre,
    unidad: material.unidad,
    stockActual,
    puntoReorden,
    estado: stockActual < puntoReorden ? 'REORDEN' : 'NORMAL',
  };
}

async function obtenerAlertasReorden() {
  const materiales = await Material.findAll({
    where: { activo: true },
    order: [['nombre', 'ASC']],
  });
  const estados = await Promise.all(materiales.map(obtenerEstadoReorden));
  return estados.filter(({ estado }) => estado === 'REORDEN');
}

module.exports = {
  calcularPuntoReorden,
  calcularStock,
  obtenerAlertasReorden,
};
