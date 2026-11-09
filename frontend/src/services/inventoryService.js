export async function getDashboard(request) {
  const results = await Promise.allSettled([
    request('/materiales'),
    request('/alertas/reorden'),
    request('/ordenes/posibles-duplicados'),
    request('/ordenes'),
    request('/proveedores'),
  ]);
  const failures = results.filter((result) => result.status === 'rejected');
  const [materialResult, alertResult, duplicateResult, orderResult, supplierResult] = results;
  const materials = materialResult.status === 'fulfilled' && Array.isArray(materialResult.value.datos)
    ? materialResult.value.datos
    : [];
  const alerts = alertResult.status === 'fulfilled' && Array.isArray(alertResult.value.alertas)
    ? alertResult.value.alertas
    : [];
  const duplicates = duplicateResult.status === 'fulfilled' && Array.isArray(duplicateResult.value.duplicados)
    ? duplicateResult.value.duplicados
    : [];
  const orders = orderResult.status === 'fulfilled' && Array.isArray(orderResult.value.datos)
    ? orderResult.value.datos
    : [];
  const suppliers = supplierResult.status === 'fulfilled' && Array.isArray(supplierResult.value.datos)
    ? supplierResult.value.datos
    : [];

  const stockResults = materials.length
    ? await Promise.allSettled(materials.map((material) => request(`/materiales/${material.id}/stock`)))
    : [];
  const stocks = stockResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const failedStock = stockResults.find((result) => result.status === 'rejected');
  if (failedStock) failures.push(failedStock);

  return {
    dashboard: { materials, stocks, alerts, duplicates, orders, suppliers },
    connected: results.some((result) => result.status === 'fulfilled'),
    error: failures.length ? failures[0].reason : null,
  };
}

export function createMovement(request, body) {
  return request('/movimientos', { method: 'POST', body: JSON.stringify(body) });
}

export function createOrder(request, body) {
  return request('/ordenes', { method: 'POST', body: JSON.stringify(body) });
}
