import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createProduct } from '../../services/productApi.js';
import { getApiErrorMessage } from '../../utils/apiErrors.js';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export function NewProductModal({ open, onClose, onCreated }) {
  const titleId = useId();
  const nameId = useId();
  const errId = useId();
  const inputRef = useRef(null);
  const [nombre, setNombre] = useState('');
  const [costoBase, setCostoBase] = useState('1.00');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch categories para el dropdown relacional
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data.categories || []);
          if (data.data.categories.length > 0) {
            setCategoryId(data.data.categories[0]._id);
          }
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (open) {
      setNombre('');
      setCostoBase('1.00');
      setError('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed || !categoryId) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const created = await createProduct({ 
        nombreProducto: trimmed,
        costoBase: Number(costoBase),
        categoryId: categoryId
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

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
            Nuevo producto
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-slate-700">
              Nombre del producto
            </label>
            <input
              ref={inputRef}
              id={nameId}
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
              aria-invalid={Boolean(error)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Categoría (Relación Foránea)
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base bg-white"
            >
              {categories.length === 0 ? (
                <option value="">Cargando categorías...</option>
              ) : (
                categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Costo Base Inicial ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={costoBase}
              onChange={(e) => setCostoBase(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
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
              {pending ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
