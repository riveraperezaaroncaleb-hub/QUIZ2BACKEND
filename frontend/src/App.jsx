import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './components/Icon.jsx';
import { DuplicateList, KpiCard, OrdersTable, StockTable } from './components/InventoryTables.jsx';
import { Field, FormMessage, Modal } from './components/FormControls.jsx';
import { getCurrentView, navigateToView, ROUTES } from './routes.js';
import { API_BASE, createApiClient } from './services/api.js';
import { createMovement, createOrder, getDashboard } from './services/inventoryService.js';
const TOKEN_KEY = 'delValleInventoryToken';

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(number)
    : '—';
}

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function App() {
  const [activeView, setActiveView] = useState(() => getCurrentView());
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ nombre: '', correo: '', password: '' });
  const [dashboard, setDashboard] = useState({ materials: [], stocks: [], alerts: [], duplicates: [], orders: [], suppliers: [] });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState('');
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementBusy, setMovementBusy] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [movementSuccess, setMovementSuccess] = useState('');
  const [movementForm, setMovementForm] = useState({
    materialId: '', tipo: 'entrada', cantidad: '', referencia: '',
    ubicacionOrigen: '', ubicacionDestino: '',
  });
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderForm, setOrderForm] = useState({
    proveedorId: '', estado: 'pendiente', observaciones: '',
    materialId: '', cantidad: '', precioUnitario: '',
  });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setShowAuth(true);
  }, []);
  const request = useMemo(() => createApiClient(handleUnauthorized), [handleUnauthorized]);

  useEffect(() => {
    function syncRoute() {
      setActiveView(getCurrentView());
    }
    window.addEventListener('hashchange', syncRoute);
    if (!window.location.hash) navigateToView('overview');
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setDashboard({ materials: [], stocks: [], alerts: [], duplicates: [], orders: [], suppliers: [] });
    setApiError('');
    setConnected(false);
    setShowAuth(false);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setApiError('');
    try {
      const result = await getDashboard(request);
      setDashboard(result.dashboard);
      setConnected(result.connected);
      if (result.error) setApiError(getErrorMessage(result.error));
    } finally {
      setLoading(false);
    }
  }, [token, request]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    request('/auth/me', {}, token)
      .then((result) => {
        if (cancelled) return;
        setUser(result.usuario);
        setConnected(true);
        setShowAuth(false);
      })
      .catch((error) => {
        if (cancelled) return;
        if (localStorage.getItem(TOKEN_KEY)) {
          setApiError(getErrorMessage(error));
          setConnected(false);
        }
      });
    return () => { cancelled = true; };
  }, [token, request]);

  useEffect(() => {
    if (token && user) loadDashboard();
  }, [token, user, loadDashboard]);

  const filteredMaterials = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return dashboard.stocks;
    return dashboard.stocks.filter((item) => (
      `${item.codigo || ''} ${item.nombre || ''}`.toLocaleLowerCase('es-MX').includes(normalized)
    ));
  }, [dashboard.stocks, query]);

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
    const body = authMode === 'register'
      ? authForm
      : { correo: authForm.correo, password: authForm.password };
    try {
      const result = await request(endpoint, { method: 'POST', body: JSON.stringify(body) }, '');
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setUser(result.usuario);
      setShowAuth(false);
      setAuthForm({ nombre: '', correo: '', password: '' });
      setConnected(true);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitMovement(event) {
    event.preventDefault();
    setMovementError('');
    setMovementSuccess('');
    setMovementBusy(true);
    const body = {
      materialId: Number(movementForm.materialId),
      tipo: movementForm.tipo,
      cantidad: Number(movementForm.cantidad),
    };
    if (movementForm.referencia.trim()) body.referencia = movementForm.referencia.trim();
    if (body.tipo === 'traslado') {
      body.ubicacionOrigen = movementForm.ubicacionOrigen.trim();
      body.ubicacionDestino = movementForm.ubicacionDestino.trim();
    }
    try {
      const result = await createMovement(request, body);
      setMovementSuccess(`Movimiento registrado. Nuevo stock: ${formatNumber(result.stockActual)}.`);
      setMovementForm({ materialId: '', tipo: 'entrada', cantidad: '', referencia: '', ubicacionOrigen: '', ubicacionDestino: '' });
      await loadDashboard();
    } catch (error) {
      setMovementError(getErrorMessage(error));
    } finally {
      setMovementBusy(false);
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    setOrderError('');
    setOrderSuccess('');
    setOrderBusy(true);
    const body = {
      proveedorId: Number(orderForm.proveedorId),
      estado: orderForm.estado,
      observaciones: orderForm.observaciones.trim() || undefined,
      detalles: [{
        materialId: Number(orderForm.materialId),
        cantidad: Number(orderForm.cantidad),
        precioUnitario: Number(orderForm.precioUnitario || 0),
      }],
    };
    try {
      const order = await createOrder(request, body);
      setOrderSuccess(`Orden #${order.id} creada correctamente.`);
      setOrderForm({ proveedorId: '', estado: 'pendiente', observaciones: '', materialId: '', cantidad: '', precioUnitario: '' });
      await loadDashboard();
    } catch (error) {
      setOrderError(getErrorMessage(error));
    } finally {
      setOrderBusy(false);
    }
  }

  const titles = { overview: 'Resumen', materials: 'Inventario de materiales', orders: 'Órdenes de compra' };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={ROUTES.overview}>
          <span className="brand-mark"><Icon name="building" size={23} /></span>
          <span><strong>DEL VALLE</strong><small>CONTROL DE INVENTARIO</small></span>
        </a>
        <div className="side-label">OPERACIÓN</div>
        <nav className="side-nav" aria-label="Navegación principal">
          {[
            ['overview', 'overview', 'Panel general'],
            ['materials', 'box', 'Materiales'],
            ['orders', 'cart', 'Órdenes de compra'],
          ].map(([view, icon, label]) => (
            <button type="button" className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => navigateToView(view)} key={view}>
              <Icon name={icon} size={18} /> <span>{label}</span>
              {view === 'materials' && dashboard.alerts.length > 0 && <span className="nav-count">{dashboard.alerts.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-card">
            <span className={`connection-dot ${connected ? 'online' : ''}`} />
            <span><strong>{connected ? 'API conectada' : 'API sin conexión'}</strong><small>{API_BASE}</small></span>
          </div>
          {user && <button className="signout-button" onClick={signOut} type="button"><Icon name="logout" size={16} /> Cerrar sesión</button>}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Icon name="building" size={21} /></span><strong>DEL VALLE</strong></div>
          <div className="breadcrumb"><span>Constructora Del Valle S.A.</span><span className="crumb-slash">/</span><strong>{titles[activeView]}</strong></div>
          <div className="top-actions">
            <span className={`status-pill ${connected ? 'online' : ''}`}><i />{connected ? 'Conectado' : 'Desconectado'}</span>
            {user ? (
              <div className="user-chip"><span className="avatar">{(user.nombre || user.correo || 'U').slice(0, 1).toUpperCase()}</span><span>{user.nombre || user.correo}</span></div>
            ) : (
              <button type="button" className="button button-primary button-small" onClick={() => { setShowAuth(true); setAuthMode('login'); }}>Iniciar sesión</button>
            )}
            {user && <button className="mobile-logout" type="button" onClick={signOut} aria-label="Cerrar sesión"><Icon name="logout" size={17} /></button>}
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <h1>{titles[activeView]}<span className="heading-period">.</span></h1>
              <p>{activeView === 'overview' ? 'Una vista clara de tus existencias, compras y alertas.' : activeView === 'materials' ? 'Consulta el stock calculado y anticipa el próximo reabastecimiento.' : 'Supervisa compras y crea órdenes para tus proveedores.'}</p>
            </div>
            <div className="heading-actions">
              <button className="button button-secondary" type="button" onClick={loadDashboard} disabled={!token || loading}><Icon name="refresh" size={16} className={loading ? 'spin' : ''} /> Actualizar</button>
              <button className="button button-primary" type="button" onClick={() => { if (!token) { setShowAuth(true); return; } setMovementError(''); setMovementSuccess(''); setMovementOpen(true); }}><Icon name="plus" size={16} /> Movimiento</button>
            </div>
          </section>

          {!user && (
            <div className="notice notice-warn">
              <Icon name="shield" size={19} />
              <p>Inicia sesión para consultar el inventario. La API requiere autenticación JWT.</p>
              <button className="notice-action" type="button" onClick={() => { setShowAuth(true); setAuthMode('login'); }}>Acceder <span>→</span></button>
            </div>
          )}
          {apiError && <div className="notice notice-error"><span>{apiError}</span><button type="button" onClick={() => setApiError('')} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button></div>}

          {activeView === 'overview' && (
            <>
              <section className="kpi-grid" aria-label="Indicadores clave">
                <KpiCard label="Materiales registrados" value={formatNumber(dashboard.materials.length)} hint="En el catálogo de inventario" icon="box" tone="blue" />
                <KpiCard label="Alertas de reorden" value={formatNumber(dashboard.alerts.length)} hint="Stock debajo del punto de reorden" icon="alert" tone="red" />
                <KpiCard label="OC sospechosas" value={formatNumber(dashboard.duplicates.length)} hint="Coincidencias dentro de 48 horas" icon="copy" tone="amber" />
              </section>

              <section className="content-card stock-card">
                <div className="card-header">
                  <div className="section-title"><span className="section-icon red"><Icon name="alert" size={18} /></span><div><h2>Stock y alertas</h2><p>Existencias calculadas a partir de los movimientos</p></div></div>
                  <button className="text-link" type="button" onClick={() => navigateToView('materials')}>Ver inventario <span>→</span></button>
                </div>
                <StockTable rows={dashboard.stocks.filter((row) => row.estado === 'REORDEN')} loading={loading} error={apiError} emptyText="Todo está bajo control" emptySubtext="No hay materiales por debajo de su punto de reorden." />
              </section>

              <div className="lower-grid">
                <section className="content-card">
                  <div className="card-header">
                    <div className="section-title"><span className="section-icon amber"><Icon name="copy" size={18} /></span><div><h2>Posibles duplicados</h2><p>Revisión de órdenes cercanas en el tiempo</p></div></div>
                    <span className="count-chip">{dashboard.duplicates.length} casos</span>
                  </div>
                  <DuplicateList rows={dashboard.duplicates.slice(0, 4)} loading={loading} />
                </section>
                <section className="quick-card">
                  <div className="quick-top"><span className="section-icon green"><Icon name="plus" size={19} /></span><span className="quick-kicker">ACCIÓN RÁPIDA</span></div>
                  <h2>Registra un movimiento</h2>
                  <p>Mantén el stock actualizado con entradas, salidas o traslados entre almacenes.</p>
                  <button type="button" className="button button-primary quick-action" onClick={() => { if (!token) { setShowAuth(true); return; } setMovementError(''); setMovementSuccess(''); setMovementOpen(true); }}>Nuevo movimiento <span>→</span></button>
                  <div className="quick-divider" />
                  <div className="quick-order"><div><strong>¿Necesitas abastecer?</strong><small>Crea una orden de compra</small></div><button type="button" aria-label="Crear orden" onClick={() => { if (!token) { setShowAuth(true); return; } setOrderError(''); setOrderSuccess(''); setOrderOpen(true); }}><Icon name="plus" size={17} /></button></div>
                </section>
              </div>
            </>
          )}

          {activeView === 'materials' && (
            <section className="content-card full-card">
              <div className="card-header card-header-wrap">
                <div className="section-title"><span className="section-icon blue"><Icon name="box" size={18} /></span><div><h2>Inventario de materiales</h2><p>{dashboard.stocks.length} registros con stock calculado</p></div></div>
                <label className="search-box"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código o nombre" /></label>
              </div>
              <StockTable rows={filteredMaterials} loading={loading} error={apiError} emptyText="No hay materiales" emptySubtext="Los materiales aparecerán aquí al conectarse con la API." />
            </section>
          )}

          {activeView === 'orders' && (
            <section className="content-card full-card">
              <div className="card-header">
                <div className="section-title"><span className="section-icon blue"><Icon name="cart" size={18} /></span><div><h2>Órdenes de compra</h2><p>{dashboard.orders.length} órdenes registradas</p></div></div>
                <button type="button" className="button button-primary button-small" onClick={() => { if (!token) { setShowAuth(true); return; } setOrderError(''); setOrderSuccess(''); setOrderOpen(true); }}><Icon name="plus" size={15} /> Nueva orden</button>
              </div>
              <OrdersTable rows={dashboard.orders} loading={loading} />
            </section>
          )}

          <footer className="footer"><span>CONSTRUCTORA DEL VALLE S.A. <i>·</i> Sistema de inventario</span><span>API <code>{API_BASE}</code></span></footer>
        </div>
      </main>

      {showAuth && (
        <Modal onClose={() => setShowAuth(false)}>
          <div className="modal-heading"><span className="section-icon amber"><Icon name="shield" size={19} /></span><div><div className="eyebrow">ACCESO SEGURO</div><h2>{authMode === 'login' ? 'Bienvenido de vuelta' : 'Crear una cuenta'}</h2><p>{authMode === 'login' ? 'Ingresa tus credenciales para continuar.' : 'Regístrate para acceder al sistema de inventario.'}</p></div><button className="icon-button modal-close" type="button" onClick={() => setShowAuth(false)} aria-label="Cerrar"><Icon name="close" size={19} /></button></div>
          <form className="form-stack" onSubmit={submitAuth}>
            {authMode === 'register' && <Field label="Nombre completo"><input required minLength="2" maxLength="100" autoComplete="name" value={authForm.nombre} onChange={(event) => setAuthForm({ ...authForm, nombre: event.target.value })} placeholder="Tu nombre" /></Field>}
            <Field label="Correo electrónico"><input required type="email" autoComplete="email" value={authForm.correo} onChange={(event) => setAuthForm({ ...authForm, correo: event.target.value })} placeholder="nombre@empresa.com" /></Field>
            <Field label="Contraseña"><input required type="password" minLength="8" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Al menos 8 caracteres" /></Field>
            {authError && <FormMessage type="error">{authError}</FormMessage>}
            <button type="submit" className="button button-primary button-wide" disabled={authBusy}>{authBusy ? 'Conectando…' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta y entrar'}</button>
          </form>
          <p className="modal-switch">{authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}</button></p>
        </Modal>
      )}

      {movementOpen && (
        <Modal onClose={() => setMovementOpen(false)}>
          <div className="modal-heading"><span className="section-icon green"><Icon name="plus" size={19} /></span><div><div className="eyebrow">INVENTARIO</div><h2>Registrar movimiento</h2><p>El stock se recalculará al guardar.</p></div><button className="icon-button modal-close" type="button" onClick={() => setMovementOpen(false)} aria-label="Cerrar"><Icon name="close" size={19} /></button></div>
          <form className="form-stack" onSubmit={submitMovement}>
            <Field label="Material"><select required value={movementForm.materialId} onChange={(event) => setMovementForm({ ...movementForm, materialId: event.target.value })}><option value="">Selecciona un material</option>{dashboard.materials.map((material) => <option value={material.id} key={material.id}>{material.codigo} — {material.nombre}</option>)}</select></Field>
            <div className="form-row">
              <Field label="Tipo"><select value={movementForm.tipo} onChange={(event) => setMovementForm({ ...movementForm, tipo: event.target.value })}><option value="entrada">Entrada</option><option value="salida">Salida</option><option value="traslado">Traslado</option></select></Field>
              <Field label="Cantidad"><input required type="number" min="0.001" step="any" value={movementForm.cantidad} onChange={(event) => setMovementForm({ ...movementForm, cantidad: event.target.value })} placeholder="0" /></Field>
            </div>
            {movementForm.tipo === 'traslado' && <div className="form-row"><Field label="Ubicación origen"><input required maxLength="100" value={movementForm.ubicacionOrigen} onChange={(event) => setMovementForm({ ...movementForm, ubicacionOrigen: event.target.value })} placeholder="Almacén A" /></Field><Field label="Ubicación destino"><input required maxLength="100" value={movementForm.ubicacionDestino} onChange={(event) => setMovementForm({ ...movementForm, ubicacionDestino: event.target.value })} placeholder="Almacén B" /></Field></div>}
            <Field label="Referencia (opcional)"><input maxLength="100" value={movementForm.referencia} onChange={(event) => setMovementForm({ ...movementForm, referencia: event.target.value })} placeholder="REC-2026-001" /></Field>
            {movementError && <FormMessage type="error">{movementError}</FormMessage>}
            {movementSuccess && <FormMessage type="success">{movementSuccess}</FormMessage>}
            <button className="button button-primary button-wide" disabled={movementBusy || !dashboard.materials.length}>{movementBusy ? 'Guardando…' : 'Registrar movimiento'}</button>
          </form>
        </Modal>
      )}

      {orderOpen && (
        <Modal onClose={() => setOrderOpen(false)}>
          <div className="modal-heading"><span className="section-icon blue"><Icon name="cart" size={19} /></span><div><div className="eyebrow">ABASTECIMIENTO</div><h2>Nueva orden de compra</h2><p>Crea una orden con un detalle inicial.</p></div><button className="icon-button modal-close" type="button" onClick={() => setOrderOpen(false)} aria-label="Cerrar"><Icon name="close" size={19} /></button></div>
          <form className="form-stack" onSubmit={submitOrder}>
            <Field label="Proveedor"><select required value={orderForm.proveedorId} onChange={(event) => setOrderForm({ ...orderForm, proveedorId: event.target.value })}><option value="">Selecciona un proveedor</option>{dashboard.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.nombre}</option>)}</select>{!dashboard.suppliers.length && <small className="field-note">Primero registra proveedores en el sistema.</small>}</Field>
            <div className="form-row">
              <Field label="Material"><select required value={orderForm.materialId} onChange={(event) => setOrderForm({ ...orderForm, materialId: event.target.value })}><option value="">Selecciona</option>{dashboard.materials.map((material) => <option value={material.id} key={material.id}>{material.codigo} — {material.nombre}</option>)}</select></Field>
              <Field label="Estado"><select value={orderForm.estado} onChange={(event) => setOrderForm({ ...orderForm, estado: event.target.value })}><option value="pendiente">Pendiente</option><option value="borrador">Borrador</option><option value="recibida">Recibida</option><option value="cancelada">Cancelada</option></select></Field>
            </div>
            <div className="form-row">
              <Field label="Cantidad"><input required type="number" min="0.001" step="any" value={orderForm.cantidad} onChange={(event) => setOrderForm({ ...orderForm, cantidad: event.target.value })} placeholder="0" /></Field>
              <Field label="Precio unitario"><input type="number" min="0" step="0.01" value={orderForm.precioUnitario} onChange={(event) => setOrderForm({ ...orderForm, precioUnitario: event.target.value })} placeholder="0.00" /></Field>
            </div>
            <Field label="Observaciones (opcional)"><textarea rows="2" maxLength="1000" value={orderForm.observaciones} onChange={(event) => setOrderForm({ ...orderForm, observaciones: event.target.value })} placeholder="Notas para esta orden" /></Field>
            {orderError && <FormMessage type="error">{orderError}</FormMessage>}
            {orderSuccess && <FormMessage type="success">{orderSuccess}</FormMessage>}
            <button className="button button-primary button-wide" disabled={orderBusy || !dashboard.suppliers.length || !dashboard.materials.length}>{orderBusy ? 'Guardando…' : 'Crear orden de compra'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default App;
