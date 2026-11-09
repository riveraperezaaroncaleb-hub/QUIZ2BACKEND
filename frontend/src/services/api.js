export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export function createApiClient(onUnauthorized) {
  return async function request(path, options = {}, accessToken = '') {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(12000),
      });
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('El servidor tardó demasiado en responder. Verifica que la API esté activa.');
      }
      throw new Error(`No fue posible conectar con ${API_BASE}. Verifica que el backend esté ejecutándose.`);
    }

    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.startsWith('/auth/')) {
      onUnauthorized();
      throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    }
    if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
    return data;
  };
}
