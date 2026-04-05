export function Spinner({ label = 'Cargando' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
