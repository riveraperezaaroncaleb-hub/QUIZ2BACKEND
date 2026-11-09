import Icon from './Icon.jsx';

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(number)
    : '—';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

export function KpiCard({ label, value, hint, icon, tone }) {
  return <article className="kpi-card"><div className="kpi-top"><span>{label}</span><span className={`kpi-icon ${tone}`}><Icon name={icon} size={19} /></span></div><strong className="kpi-value">{value}</strong><span className="kpi-hint">{hint}</span></article>;
}

export function StockTable({ rows, loading, error, emptyText, emptySubtext }) {
  if (loading && !rows.length) return <div className="table-state"><div className="spinner" /><span>Cargando datos del inventario…</span></div>;
  if (error && !rows.length) return <div className="table-state error-state"><span>{error}</span><span className="muted">Comprueba que el API y la sesión estén disponibles.</span></div>;
  if (!rows.length) return <div className="empty-state"><span className="empty-check">✓</span><strong>{emptyText}</strong><p>{emptySubtext}</p></div>;
  return (
    <div className="table-scroll"><table className="data-table">
      <thead><tr><th>CÓDIGO</th><th>MATERIAL</th><th>STOCK ACTUAL</th><th>PUNTO DE REORDEN</th><th>ESTADO</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.materialId || row.id}>
        <td><span className="code">{row.codigo || `MAT-${row.materialId}`}</span></td>
        <td><strong>{row.nombre || row.descripcion || 'Material'}</strong><small>{row.unidad || '—'}</small></td>
        <td><strong className={row.estado === 'REORDEN' ? 'stock-low' : ''}>{formatNumber(row.stockActual)}</strong><small>{row.unidad || ''}</small></td>
        <td>{formatNumber(row.puntoReorden)} <small>{row.unidad || ''}</small></td>
        <td><span className={`badge ${row.estado === 'REORDEN' ? 'badge-red' : 'badge-green'}`}><i />{row.estado || 'NORMAL'}</span></td>
      </tr>)}</tbody>
    </table></div>
  );
}

export function DuplicateList({ rows, loading }) {
  if (loading && !rows.length) return <div className="table-state compact"><div className="spinner" /><span>Buscando coincidencias…</span></div>;
  if (!rows.length) return <div className="empty-state compact-empty"><span className="empty-check">✓</span><strong>No hay coincidencias</strong><p>Las órdenes que requieren revisión aparecerán aquí.</p></div>;
  return <div className="duplicate-list">{rows.map((row, index) => {
    const matches = row.coincidencias || [];
    return <article className="duplicate-item" key={`${row.orden1?.id}-${row.orden2?.id}-${index}`}>
      <div className="duplicate-top"><div><strong>{row.proveedor?.nombre || 'Proveedor'}</strong><small>OC #{row.orden1?.id ?? '—'} <span>↔</span> OC #{row.orden2?.id ?? '—'}</small></div><span className="review-badge">REVISAR · 48 H</span></div>
      {matches.slice(0, 2).map((match, matchIndex) => <div className="match-line" key={`${match.material?.id}-${matchIndex}`}><span>{match.material?.nombre || 'Artículo'}</span><strong>{formatNumber(match.cantidad)} {match.material?.unidad || ''}</strong></div>)}
      {!matches.length && <div className="match-line"><span>Coincidencia detectada en las órdenes</span><strong>Revisar</strong></div>}
    </article>;
  })}</div>;
}

export function OrdersTable({ rows, loading }) {
  if (loading && !rows.length) return <div className="table-state"><div className="spinner" /><span>Cargando órdenes de compra…</span></div>;
  if (!rows.length) return <div className="empty-state"><span className="empty-check">—</span><strong>Sin órdenes registradas</strong><p>Las órdenes de compra aparecerán en esta tabla.</p></div>;
  return <div className="table-scroll"><table className="data-table order-table"><thead><tr><th>NÚMERO</th><th>PROVEEDOR</th><th>FECHA</th><th>ARTÍCULOS</th><th>ESTADO</th></tr></thead><tbody>
    {rows.map((order) => <tr key={order.id}><td><span className="code">OC-{String(order.id).padStart(4, '0')}</span></td><td><strong>{order.Proveedor?.nombre || '—'}</strong></td><td>{formatDate(order.fechaOrden)}</td><td>{order.detalles?.length || 0} artículo(s)</td><td><span className={`badge ${order.estado === 'recibida' ? 'badge-green' : order.estado === 'cancelada' ? 'badge-red' : 'badge-amber'}`}>{order.estado || 'pendiente'}</span></td></tr>)}
  </tbody></table></div>;
}
