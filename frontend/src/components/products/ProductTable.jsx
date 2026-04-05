import { Pencil, Trash2 } from 'lucide-react';

/**
 * Tabla responsive; botones enfocables con Tab en orden visual.
 */
export function ProductTable({
  products,
  onEntrada,
  onSalida,
  onRename,
  onDelete,
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
        No hay productos que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="min-w-full divide-y divide-slate-200 border border-slate-200 bg-white text-left text-sm shadow-sm">
        <caption className="sr-only">Listado de productos y acciones de inventario</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-3 py-3 font-semibold text-slate-700 sm:px-4">
              Producto
            </th>
            <th scope="col" className="px-3 py-3 font-semibold text-slate-700 sm:px-4">
              Stock
            </th>
            <th scope="col" className="hidden px-3 py-3 font-semibold text-slate-700 sm:table-cell sm:px-4">
              Unidad
            </th>
            <th scope="col" className="px-3 py-3 text-right font-semibold text-slate-700 sm:px-4">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/80">
              <th scope="row" className="max-w-[10rem] px-3 py-3 font-medium text-slate-900 sm:max-w-none sm:px-4">
                {p.nombreProducto}
              </th>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-800 sm:px-4">
                {Number(p.stockActual).toLocaleString('es', { maximumFractionDigits: 4 })}
              </td>
              <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 sm:table-cell sm:px-4">
                {p.unidadMedida}
              </td>
              <td className="px-2 py-2 sm:px-4">
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => onEntrada(p)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:px-3 sm:text-sm"
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => onSalida(p)}
                    className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 sm:px-3 sm:text-sm"
                  >
                    Salida
                  </button>
                  <button
                    type="button"
                    onClick={() => onRename(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm"
                    aria-label={`Renombrar ${p.nombreProducto}`}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                    <span className="hidden sm:inline">Nombre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 sm:text-sm"
                    aria-label={`Eliminar ${p.nombreProducto}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
