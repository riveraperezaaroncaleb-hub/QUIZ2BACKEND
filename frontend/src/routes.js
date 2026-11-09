export const ROUTES = {
  overview: '#/resumen',
  materials: '#/materiales',
  orders: '#/ordenes',
};

const routeViews = Object.fromEntries(
  Object.entries(ROUTES).map(([view, route]) => [route, view]),
);

export function getCurrentView(hash = window.location.hash) {
  return routeViews[hash] || 'overview';
}

export function navigateToView(view) {
  window.location.hash = ROUTES[view] || ROUTES.overview;
}
