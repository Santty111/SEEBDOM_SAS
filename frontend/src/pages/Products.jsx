import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ProductSearch } from '../components/products/ProductSearch.jsx';
import { ProductTable } from '../components/products/ProductTable.jsx';
import { InventoryModal } from '../components/products/InventoryModal.jsx';
import { RenameProductModal } from '../components/products/RenameProductModal.jsx';
import { NewProductModal } from '../components/products/NewProductModal.jsx';
import { ConfirmDeleteModal } from '../components/products/ConfirmDeleteModal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import {
  deleteProduct,
  fetchProducts,
} from '../services/productApi.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';

function normalize(s) {
  return s.trim().toLowerCase();
}

export default function Products() {
  const searchFieldId = useId();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [query, setQuery] = useState('');

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState('entrada');
  const [activeProduct, setActiveProduct] = useState(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setListError('');
    setLoading(true);
    try {
      const list = await fetchProducts();
      setProducts(list);
    } catch (e) {
      setListError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return products;
    return products.filter((p) => normalize(p.nombreProducto || '').includes(q));
  }, [products, query]);

  function mergeProduct(updated) {
    if (!updated?.id) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  function upsertProduct(created) {
    if (!created?.id) return;
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === created.id);
      if (i === -1) return [...prev, created].sort((a, b) =>
        (a.nombreProducto || '').localeCompare(b.nombreProducto || '', 'es')
      );
      const next = [...prev];
      next[i] = { ...next[i], ...created };
      return next;
    });
  }

  function removeProductLocal(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const openEntrada = (p) => {
    setActiveProduct(p);
    setInventoryMode('entrada');
    setInventoryOpen(true);
  };

  const openSalida = (p) => {
    setActiveProduct(p);
    setInventoryMode('salida');
    setInventoryOpen(true);
  };

  const openRename = (p) => {
    setActiveProduct(p);
    setRenameOpen(true);
  };

  const openDelete = (p) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteProduct(deleteTarget.id);
      removeProductLocal(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      setListError(getApiErrorMessage(e));
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return <Spinner label="Cargando productos" />;
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Busque por nombre o escanee un código; use Entrada / Salida para movimientos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Nuevo producto
        </button>
      </header>

      {listError ? (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {listError}
        </div>
      ) : null}

      <section aria-labelledby="products-section-title" className="space-y-4">
        <h2 id="products-section-title" className="sr-only">
          Filtro y tabla de productos
        </h2>
        <ProductSearch
          id={searchFieldId}
          label="Buscar producto"
          value={query}
          onChange={setQuery}
          disabled={false}
        />
        <ProductTable
          products={filtered}
          onEntrada={openEntrada}
          onSalida={openSalida}
          onRename={openRename}
          onDelete={openDelete}
        />
      </section>

      <InventoryModal
        open={inventoryOpen}
        product={activeProduct}
        mode={inventoryMode}
        onClose={() => setInventoryOpen(false)}
        onSaved={mergeProduct}
      />

      <RenameProductModal
        open={renameOpen}
        product={activeProduct}
        onClose={() => setRenameOpen(false)}
        onSaved={mergeProduct}
      />

      <NewProductModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={upsertProduct}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        productName={deleteTarget?.nombreProducto || ''}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </div>
  );
}
