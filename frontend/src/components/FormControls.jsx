import { useEffect } from 'react';

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function FormMessage({ type, children }) {
  return <div className={`form-message ${type}`}>{children}</div>;
}

export function Modal({ children, onClose }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-panel" role="dialog" aria-modal="true">{children}</section></div>;
}
