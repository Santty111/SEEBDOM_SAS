import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import { fetchProducts } from '../services/productApi.js';
import { 
  Truck, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  DollarSign, 
  RefreshCcw,
  PackageCheck,
  Ship,
  Boxes,
  Scale
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('cruce');
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cruce Manual y Proyecciones (Sin Fórmulas)
  const [yearBase, setYearBase] = useState('2024');
  const [yearObjetivo, setYearObjetivo] = useState('2026');
  const [comparisonGrid, setComparisonGrid] = useState([]);
  const [calculatingCruce, setCalculatingCruce] = useState(false);
  const [selectedProductFilter, setSelectedProductFilter] = useState('Todos');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('Todos');

  // States for manual creation forms
  const [newOrderLoc, setNewOrderLoc] = useState('');
  const [newOrderUrg, setNewOrderUrg] = useState('Media');
  
  const [newSupplyProv, setNewSupplyProv] = useState('');
  const [newSupplyEta, setNewSupplyEta] = useState('');

  // Filtros de Distribución
  const [distFilterYear, setDistFilterYear] = useState('Todos');
  const [distFilterMonth, setDistFilterMonth] = useState('Todos');

  // Dispatch Modal States
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchOrderTarget, setDispatchOrderTarget] = useState(null);
  const [dispatchType, setDispatchType] = useState('Delivery');
  const [dispatchCost, setDispatchCost] = useState('15');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'cruce') {
      fetchComparisonGrid();
    }
  }, [yearBase, yearObjetivo, activeTab]);

  const fetchComparisonGrid = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/dashboard/predicciones/comparar?yearBase=${yearBase}&yearObjetivo=${yearObjetivo}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setComparisonGrid(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar cuadrícula comparativa', err);
    }
  };

  const handleRunCruce = async () => {
    setCalculatingCruce(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard/predicciones/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}`
        },
        body: JSON.stringify({ yearBase, yearObjetivo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al ejecutar cruce manual');
      alert(data.message);
      fetchComparisonGrid();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setCalculatingCruce(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Usamos Promise.all para cargar todo en paralelo (Senior practice)
      const [distRes, alertRes, supplyRes, productsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard/distribucion', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` }
        }).then(res => res.json()),
        fetch('http://localhost:5000/api/admin/dashboard/alertas', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` }
        }).then(res => res.json()),
        fetch('http://localhost:5000/api/admin/dashboard/abastecimiento', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` }
        }).then(res => res.json()),
        fetchProducts()
      ]);

      setOrders(distRes.data || []);
      setAlerts(alertRes.data || []);
      setSupplies(supplyRes.data || []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
    } catch (err) {
      console.error('Error al cargar dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchClick = (order) => {
    setDispatchOrderTarget(order);
    setDispatchType('Delivery');
    setDispatchCost('15');
    setDispatchModalOpen(true);
  };

  const handleDispatchConfirm = async () => {
    if (!dispatchOrderTarget) return;
    try {
      const costo = dispatchType === 'Delivery' ? (Number(dispatchCost) || 0) : 0;
      
      await fetch(`http://localhost:5000/api/admin/dashboard/despacho/${dispatchOrderTarget._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` 
        },
        body: JSON.stringify({ costoOperativo: costo })
      });
      setDispatchModalOpen(false);
      setDispatchOrderTarget(null);
      fetchDashboardData(); // Recargar
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrderLoc) return;
    try {
      await fetch('http://localhost:5000/api/admin/dashboard/pedidos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` 
        },
        body: JSON.stringify({ ubicacion: newOrderLoc, urgencia: newOrderUrg })
      });
      setNewOrderLoc('');
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleCreateSupply = async (e) => {
    e.preventDefault();
    if (!newSupplyProv || !newSupplyEta) return;
    try {
      await fetch('http://localhost:5000/api/admin/dashboard/abastecimiento', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sebdom.auth.token')}` 
        },
        body: JSON.stringify({ proveedor: newSupplyProv, eta: newSupplyEta, estado: 'Programado' })
      });
      setNewSupplyProv('');
      setNewSupplyEta('');
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'Baja': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'Media': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'Alta': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'Crítica': 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return colors[urgency] || colors['Media'];
  };



  if (loading) return (
    <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Administración
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Core Comparativo y de Distribución SEBDOM V2
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:self-auto transition-colors"
        >
          <RefreshCcw size={18} /> Actualizar Datos
        </button>
      </header>

      {/* Navegación de Módulos */}
      <nav className="flex flex-wrap gap-2 mb-8 bg-slate-50/50 p-1.5 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'resumen', label: 'Resumen General', icon: Boxes },
          { id: 'cruce', label: 'Cruce & Proyecciones', icon: Scale },
          { id: 'distribucion', label: 'Distribución & Despacho', icon: Truck },
          { id: 'stock', label: 'Alertas de Stock', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-brand-700 border border-slate-200 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO DE MÓDULOS */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* MÓDULO 0: RESUMEN GENERAL (Heredado del antiguo Dashboard) */}
        {activeTab === 'resumen' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Indicadores Generales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-brand-600">
                  <Boxes size={32} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Productos Registrados</p>
                  <p className="text-4xl font-bold mt-1 text-slate-900">{products.length}</p>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-600">
                  <Scale size={32} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Stock Total de Inventario</p>
                  <p className="text-4xl font-bold mt-1 text-slate-900">
                    {products.reduce((acc, p) => acc + (Number(p.stockActual) || 0), 0).toLocaleString('es', { maximumFractionDigits: 2 })}<span className="text-sm font-normal text-slate-500 ml-1">kg</span>
                  </p>
                </div>
              </article>
            </div>
          </section>
        )}



        {/* MÓDULO 2: DISTRIBUCIÓN & DESPACHO */}
        {activeTab === 'distribucion' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Lista de Pedidos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="text-brand-600" /> Cola de Distribución Activa
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none shadow-sm"
                    value={distFilterYear}
                    onChange={(e) => setDistFilterYear(e.target.value)}
                  >
                    <option value="Todos">Año: Todos</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                  <select
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none shadow-sm"
                    value={distFilterMonth}
                    onChange={(e) => setDistFilterMonth(e.target.value)}
                  >
                    <option value="Todos">Mes: Todos</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              </div>

              {/* Formulario Manual de Nuevo Pedido */}
              <form onSubmit={handleCreateOrder} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 mb-6 shadow-sm">
                <input 
                  type="text" 
                  placeholder="Ubicación del cliente..." 
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                  value={newOrderLoc}
                  onChange={(e) => setNewOrderLoc(e.target.value)}
                  required
                />
                <select 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                  value={newOrderUrg}
                  onChange={(e) => setNewOrderUrg(e.target.value)}
                >
                  <option value="Baja">Baja Urgencia</option>
                  <option value="Media">Media Urgencia</option>
                  <option value="Alta">Alta Urgencia</option>
                  <option value="Crítica">Crítica (ASAP)</option>
                </select>
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap">
                  Crear Pedido
                </button>
              </form>

              {orders.filter(order => {
                if (distFilterYear === 'Todos' && distFilterMonth === 'Todos') return true;
                const date = new Date(order.fechaPedido || order.fechaDespacho || order.createdAt);
                const y = date.getFullYear().toString();
                const m = (date.getMonth() + 1).toString();
                if (distFilterYear !== 'Todos' && y !== distFilterYear) return false;
                if (distFilterMonth !== 'Todos' && m !== distFilterMonth) return false;
                return true;
              }).length > 0 ? orders.filter(order => {
                if (distFilterYear === 'Todos' && distFilterMonth === 'Todos') return true;
                const date = new Date(order.fechaPedido || order.fechaDespacho || order.createdAt);
                const y = date.getFullYear().toString();
                const m = (date.getMonth() + 1).toString();
                if (distFilterYear !== 'Todos' && y !== distFilterYear) return false;
                if (distFilterMonth !== 'Todos' && m !== distFilterMonth) return false;
                return true;
              }).map(order => (
                <article key={order._id} className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                      <MapPin className="text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{order.ubicacion}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          order.urgency === 'Crítica' ? 'bg-red-50 text-red-700 border-red-200' :
                          order.urgency === 'Alta' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          order.urgency === 'Media' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {order.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" /> 
                        {new Date(order.fechaPedido || order.fechaDespacho || order.createdAt).toLocaleDateString()} 
                        <span className="text-slate-300 mx-1">•</span> 
                        <span className={order.estado === 'Pendiente' ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>{order.estado}</span>
                      </p>
                    </div>
                  </div>
                  {order.estado === 'Pendiente' && (
                    <button 
                      onClick={() => handleDispatchClick(order)}
                      className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                      <PackageCheck size={16} /> Despachar
                    </button>
                  )}
                </article>
              )) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-12 rounded-xl text-center text-slate-500">
                  No hay pedidos pendientes de despacho en este momento
                </div>
              )}
            </div>

            {/* Abastecimiento de Terceros / Sidebar */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Ship className="text-emerald-600" /> Abastecimiento 3ros
              </h3>
              <div className="space-y-6">
                {supplies.map((supply) => (
                  <div key={supply._id || supply.id} className="relative pl-4 border-l-2 border-emerald-500">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                    <p className="text-sm font-semibold text-slate-900">{supply.proveedor}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{supply.estado} • ETA: {supply.eta}</p>
                  </div>
                ))}
                {supplies.length === 0 && <p className="text-xs text-slate-500 italic">No hay abastecimientos programados</p>}
                
                <form onSubmit={handleCreateSupply} className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-700 uppercase">Programar Manualmente</p>
                  <input 
                    type="text" placeholder="Proveedor..." required
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full outline-none"
                    value={newSupplyProv} onChange={e => setNewSupplyProv(e.target.value)}
                  />
                  <input 
                    type="text" placeholder="ETA (Ej: Mañana)" required
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full outline-none"
                    value={newSupplyEta} onChange={e => setNewSupplyEta(e.target.value)}
                  />
                  <button type="submit" className="w-full mt-2 py-2.5 text-sm text-emerald-700 font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors bg-white shadow-sm">
                    Añadir a la cola
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* MÓDULO 3: ALERTAS DE STOCK */}
        {activeTab === 'stock' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {alerts.length > 0 ? alerts.map(alert => (
              <article key={alert.id} className="bg-white border border-slate-200 border-t-4 border-t-red-500 p-6 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 text-red-50 transition-colors group-hover:text-red-100">
                  <AlertTriangle size={60} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 relative z-10">{alert.nombre}</h4>
                <div className="flex justify-between items-end mt-4 relative z-10">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Stock Actual</p>
                    <p className="text-3xl font-black text-red-600">{alert.stockActual}<span className="text-sm font-semibold text-slate-500 ml-1">kg</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center justify-end gap-1 mb-1">
                      <DollarSign size={12} /> Reposición
                    </p>
                    <p className="text-lg font-bold text-slate-900">${alert.costoReposicion.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                  <p className="text-xs text-slate-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong className="text-red-700">{alert.faltante}kg</strong> faltantes para alcanzar el nivel óptimo de seguridad.
                  </p>
                </div>
              </article>
            )) : (
              <div className="col-span-full bg-emerald-50 border border-emerald-200 p-10 rounded-xl text-center shadow-sm">
                <PackageCheck className="mx-auto text-emerald-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-emerald-800">Todo en Orden</h3>
                <p className="text-emerald-600 mt-2">No se han detectado productos con stock bajo el umbral crítico.</p>
              </div>
            )}
          </section>
        )}

        {/* MÓDULO 4: CRUCE & PROYECCIONES */}
        {activeTab === 'cruce' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="text-brand-600" /> Cruce Manual de Datos y Proyecciones
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Cruce de persistencia de datos entre <strong>Tabla 1 (Histórico)</strong>, <strong>Tabla 2 (Bodega Actual 2026)</strong> y <strong>Tabla 3 (Predicciones Copiadas)</strong>.
                  </p>
                </div>
                
                {/* Selectores Manuales y Controladores */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Año Base:</span>
                    <select
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-brand-500"
                      value={yearBase}
                      onChange={(e) => setYearBase(e.target.value)}
                    >
                      <option value="2024">2024 (Tabla 1)</option>
                      <option value="2025">2025 (Tabla 1)</option>
                      <option value="2026">2026 (Tabla 2)</option>
                    </select>
                  </div>
                  
                  <div className="text-slate-300 font-bold">➔</div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Año Objetivo:</span>
                    <select
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-brand-500"
                      value={yearObjetivo}
                      onChange={(e) => setYearObjetivo(e.target.value)}
                    >
                      <option value="2026">2026 (Tabla 3)</option>
                      <option value="2027">2027 (Tabla 3)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunCruce}
                    disabled={calculatingCruce}
                    className="ml-auto md:ml-0 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                  >
                    {calculatingCruce ? 'Copiando...' : 'Ejecutar Cruce Manual'}
                  </button>
                </div>
              </div>

              {/* Barra de Selección de Producto y Mes */}
              <div className="flex flex-wrap items-center gap-6 bg-slate-100/50 p-4 rounded-xl border border-slate-200/80 mb-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Selección de Producto:</span>
                  <select
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 font-medium outline-none shadow-sm focus:ring-2 focus:ring-brand-500 transition-all hover:border-slate-400"
                    value={selectedProductFilter}
                    onChange={(e) => setSelectedProductFilter(e.target.value)}
                  >
                    <option value="Todos">Todos los Productos</option>
                    {products.map((p, idx) => (
                      <option key={p.id || p._id || idx} value={p.nombreProducto}>{p.nombreProducto}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Selección de Mes:</span>
                  <select
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 font-medium outline-none shadow-sm focus:ring-2 focus:ring-brand-500 transition-all hover:border-slate-400"
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  >
                    <option value="Todos">Todos los Meses</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              </div>

              {/* Grid / Tabla Comparativa */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4">Mes</th>
                      <th className="py-3 px-4">Temporada</th>
                      <th className="py-3 px-4 text-center">Año Base ({yearBase})</th>
                      <th className="py-3 px-4 text-center">Año Objetivo ({yearObjetivo})</th>
                      <th className="py-3 px-4 text-center">Procedencia y Cierre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {comparisonGrid
                      .filter(item => selectedProductFilter === 'Todos' || item.nombreProducto === selectedProductFilter)
                      .filter(item => selectedMonthFilter === 'Todos' || item.month === Number(selectedMonthFilter))
                      .map((item, idx) => {
                      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                      
                      const isBlocked = item.objetivo.status === 'Bloqueado';
                      
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isBlocked ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{item.nombreProducto}</td>
                          <td className="py-3.5 px-4">{meses[item.month - 1]}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                              {item.temporada}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-medium text-slate-700">
                              📥 {item.base.entradas.toLocaleString()} kg / 📤 {item.base.salidas.toLocaleString()} kg
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.base.origen}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isBlocked ? (
                              <div className="italic text-rose-500 font-semibold">
                                Bloqueado (Sin Base)
                              </div>
                            ) : (
                              <div className="font-bold text-brand-600">
                                📥 {item.objetivo.entradas.toLocaleString()} kg / 📤 {item.objetivo.salidas.toLocaleString()} kg
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.objetivo.origen}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isBlocked ? (
                              <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded text-xs font-bold">
                                Bloqueo Faltante
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded text-xs font-bold">
                                Activo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {comparisonGrid
                      .filter(item => selectedProductFilter === 'Todos' || item.nombreProducto === selectedProductFilter)
                      .filter(item => selectedMonthFilter === 'Todos' || item.month === Number(selectedMonthFilter)).length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500 italic">
                          No hay datos correspondientes a los filtros de producto y mes seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* MODAL DE DESPACHO */}
      {dispatchModalOpen && dispatchOrderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cuadro de Aceptación (Despacho)</h2>
            <p className="text-sm text-slate-600 mb-6">
              Confirme el despacho para el pedido en <span className="font-semibold">{dispatchOrderTarget.ubicacion}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Despacho</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDispatchType('Retiro')}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${dispatchType === 'Retiro' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Retiro en Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchType('Delivery')}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${dispatchType === 'Delivery' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {dispatchType === 'Delivery' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Operativo del Delivery</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      value={dispatchCost}
                      onChange={(e) => setDispatchCost(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => { setDispatchModalOpen(false); setDispatchOrderTarget(null); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDispatchConfirm}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2"
              >
                <PackageCheck size={16} /> Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
