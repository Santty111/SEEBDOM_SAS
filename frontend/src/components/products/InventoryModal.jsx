import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory.js';

const UNIDADES = [
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Libras', label: 'Libras' },
];

/**
 * @param {{ open: boolean; product: object | null; mode: 'entrada' | 'salida'; onClose: () => void; onSaved: (p: object) => void }} props
 */
export function InventoryModal({ open, product, mode, onClose, onSaved }) {
  const titleId = useId();
  const qtyId = useId();
  const unitId = useId();
  const errId = useId();
  const qtyRef = useRef(null);
  const { applyMovement, pending, error, clearError } = useInventory();

  const [unidad, setUnidad] = useState('Kilogramos');
  const [cantidad, setCantidad] = useState('');

  useEffect(() => {
    if (open && product) {
      setUnidad(product.unidadMedida || 'Kilogramos');
      setCantidad('');
      clearError();
    }
  }, [open, product, clearError]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => qtyRef.current?.focus());
    }
  }, [open, mode]);

  if (!open || !product) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const n = Number(cantidad.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      return;
    }
    try {
      const updated = await applyMovement(product.id, {
        unidadMedida: unidad,
        entrada: mode === 'entrada' ? n : null,
        salida: mode === 'salida' ? n : null,
      });
      onSaved(updated);
      onClose();
    } catch {
      /* error expuesto vía hook */
    }
  }

  const label = mode === 'entrada' ? 'Registrar entrada' : 'Registrar salida';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Producto: <span className="font-medium text-slate-900">{product.nombreProducto}</span>
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={unitId} className="block text-sm font-medium text-slate-700">
              Unidad de medida
            </label>
            <select
              id={unitId}
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
            >
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={qtyId} className="block text-sm font-medium text-slate-700">
              Cantidad ({mode === 'entrada' ? 'entrada' : 'salida'})
            </label>
            <input
              ref={qtyRef}
              id={qtyId}
              type="text"
              inputMode="decimal"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errId : undefined}
            />
          </div>

          {error ? (
            <p id={errId} role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}