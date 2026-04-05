import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * Buscador con foco inicial para escaneo QR (el escáner actúa como teclado).
 */
export function ProductSearch({ id, label, value, onChange, disabled }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          name="productSearch"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre o código escaneado…"
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-base text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-100"
          aria-describedby={`${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
        El foco inicia aquí para facilitar el lector QR.
      </p>
    </div>
  );
}
