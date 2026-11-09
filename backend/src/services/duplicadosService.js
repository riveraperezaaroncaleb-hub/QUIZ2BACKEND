const { OrdenCompra, DetalleOC, Material, Proveedor } = require('../models');

const VENTANA_DUPLICADOS_MS = 48 * 60 * 60 * 1000;

async function detectarOrdenesDuplicadas() {
  const ordenes = await OrdenCompra.findAll({
    include: [
      { model: Proveedor, attributes: ['id', 'nombre'] },
      {
        model: DetalleOC,
        as: 'detalles',
        include: [{ model: Material, attributes: ['id', 'codigo', 'nombre', 'unidad'] }],
      },
    ],
    order: [['fechaOrden', 'ASC'], ['id', 'ASC']],
  });

  const posiblesDuplicados = [];
  for (let i = 0; i < ordenes.length; i += 1) {
    const primera = ordenes[i];
    for (let j = i + 1; j < ordenes.length; j += 1) {
      const segunda = ordenes[j];
      const diferencia = Math.abs(
        new Date(segunda.fechaOrden).getTime() - new Date(primera.fechaOrden).getTime(),
      );
      if (primera.proveedorId !== segunda.proveedorId || diferencia > VENTANA_DUPLICADOS_MS) {
        continue;
      }

      const coincidencias = [];
      for (const detallePrimero of primera.detalles) {
        for (const detalleSegundo of segunda.detalles) {
          if (
            detallePrimero.materialId === detalleSegundo.materialId
            && Number(detallePrimero.cantidad) === Number(detalleSegundo.cantidad)
          ) {
            coincidencias.push({
              material: detallePrimero.Material,
              cantidad: Number(detallePrimero.cantidad),
            });
          }
        }
      }

      if (coincidencias.length > 0) {
        posiblesDuplicados.push({
          proveedor: primera.Proveedor,
          orden1: {
            id: primera.id,
            fechaOrden: primera.fechaOrden,
            estado: primera.estado,
          },
          orden2: {
            id: segunda.id,
            fechaOrden: segunda.fechaOrden,
            estado: segunda.estado,
          },
          coincidencias,
        });
      }
    }
  }

  return posiblesDuplicados;
}

module.exports = { detectarOrdenesDuplicadas };
