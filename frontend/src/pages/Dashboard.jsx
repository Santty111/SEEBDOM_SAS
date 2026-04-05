import { useEffect, useState } from 'react';
import { Package, Scale, Boxes } from 'lucide-react';
import { fetchProducts } from '../services/productApi.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';
import { Spinner } from '../components/ui/Spinner.jsx';

function sumStock(products) {
  return products.reduce((acc, p) => acc + (Number(p.stockActual) || 0), 0);
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProducts();
        if (!cancelled) setProducts(list);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <Spinner label="Cargando resumen" />;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  const totalStock = sumStock(products);
  const totalProducts = products.length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Panel</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Vista rápida del inventario para el gerente.
        </p>
      </header>

      <section aria-labelledby="kpi-heading" className="grid gap-4 sm:grid-cols-2">
        <h2 id="kpi-heading" className="sr-only">
          Indicadores
        </h2>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-brand-100 p-2 text-brand-700" aria-hidden>
              <Boxes className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">Productos registrados</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalProducts}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-brand-100 p-2 text-brand-700" aria-hidden>
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">Stock total (suma)</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {totalStock.toLocaleString('es', { maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Suma de <span className="font-medium">stockActual</span> en todas las unidades
                registradas.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-8" aria-labelledby="hint-heading">
        <h2 id="hint-heading" className="sr-only">
          Acceso rápido
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
          <Package className="h-5 w-5 shrink-0" aria-hidden />
          <p>
            Use <strong>Productos</strong> para buscar con lector QR, ajustar entradas/salidas y
            editar nombres.
          </p>
        </div>
      </section>
    </div>
  );
}
