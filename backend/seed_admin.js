import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';
import User from './src/models/User.js';
import Season from './src/models/Season.js';
import Order from './src/models/Order.js';
import Lote from './src/models/Lote.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Limpiar colecciones
    await Category.deleteMany({});
    await User.deleteMany({});
    
    // Crear Usuarios de Prueba (Sincronizados con SEED_TEST_PRESETS del frontend)
    const hashedAdminPassword = await bcrypt.hash('AdminTest1234', 12);
    const hashedOperatorPassword = await bcrypt.hash('OperTest1234', 12);

    await User.create({
      email: 'admin@sebdom.test',
      password: hashedAdminPassword,
      role: 'admin'
    });

    await User.create({
      email: 'operador@sebdom.test',
      password: hashedOperatorPassword,
      role: 'operador'
    });

    console.log('Usuarios creados:');
    console.log('- Admin: admin@sebdom.test / AdminTest1234');
    console.log('- Operador: operador@sebdom.test / OperTest1234');

    const cat1 = await Category.create({ nombre: 'Mariscos Frescos' });
    const cat2 = await Category.create({ nombre: 'Congelados' });

    // --- SEED SEASONS (CORE: Evita IFs con lógica de modelos) ---
    await Season.deleteMany({});
    await Season.create([
      { nombre: 'Temporada de Veda (Invierno)', mesInicio: 6, mesFin: 8, descripcion: 'Baja producción' },
      { nombre: 'Temporada Alta (Verano)', mesInicio: 12, mesFin: 2, descripcion: 'Máxima demanda' },
      { nombre: 'Cosecha Media (Otoño)', mesInicio: 3, mesFin: 5, descripcion: 'Estabilidad' },
      { nombre: 'Cosecha Media (Primavera)', mesInicio: 9, mesFin: 11, descripcion: 'Estabilidad' }
    ]);

    // --- SEED PRODUCTS (Con stock bajo para alertas) ---
    await Product.deleteMany({});
    const prod1 = await Product.create({
      nombreProducto: 'Pulpo de Roca Premium',
      stockActual: 12, // BAJO (Threshold 50)
      costoBase: 15.5,
      categoryId: cat1._id,
      unidadMedida: 'Kilogramos'
    });

    const prod2 = await Product.create({
      nombreProducto: 'Anillos de Calamar XL',
      stockActual: 85, // OK
      costoBase: 12.0,
      categoryId: cat2._id,
      unidadMedida: 'Kilogramos'
    });

    // --- SEED LOTES (Datos históricos para la comparativa mensual) ---
    await Lote.deleteMany({});
    const lotesData = [
      { numeroLote: 'L-001', fechaPesca: new Date(2024, 0, 15), productoId: prod1._id, cantidad: 450 }, // Enero
      { numeroLote: 'L-002', fechaPesca: new Date(2024, 1, 10), productoId: prod1._id, cantidad: 380 }, // Feb
      { numeroLote: 'L-003', fechaPesca: new Date(2024, 2, 5), productoId: prod1._id, cantidad: 200 },  // Mar
      { numeroLote: 'L-004', fechaPesca: new Date(2024, 5, 20), productoId: prod1._id, cantidad: 50 },   // Jun (Bajo)
      { numeroLote: 'L-005', fechaPesca: new Date(2024, 11, 28), productoId: prod1._id, cantidad: 500 } // Dic
    ];
    await Lote.create(lotesData);

    // --- SEED ORDERS (Distribución 2 años de datos 2024 y 2025) ---
    await Order.deleteMany({});
    
    // Generar datos de 2 años (2024 y 2025) para despachos, muy diferentes entre sí
    const historicalOrders = [];
    
    // --- 2024: Año de prueba (Menor volumen, costos más altos) ---
    // Verano 2024
    historicalOrders.push({ ubicacion: 'Resort Cancún', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2024, 0, 15), fechaPedido: new Date(2024, 0, 15), valorTotal: 12000, costoTotal: 8000 });
    historicalOrders.push({ ubicacion: 'Hotel Costa Azul', urgency: 'Alta', estado: 'Despachado', fechaDespacho: new Date(2024, 1, 10), fechaPedido: new Date(2024, 1, 10), valorTotal: 9000, costoTotal: 6000 });
    // Otoño 2024
    historicalOrders.push({ ubicacion: 'Supermercados del Sol', urgency: 'Crítica', estado: 'Despachado', fechaDespacho: new Date(2024, 2, 5), fechaPedido: new Date(2024, 2, 5), valorTotal: 7000, costoTotal: 4500 });
    historicalOrders.push({ ubicacion: 'Restaurante Mar y Tierra', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2024, 3, 12), fechaPedido: new Date(2024, 3, 12), valorTotal: 6500, costoTotal: 4000 });
    // Invierno 2024
    historicalOrders.push({ ubicacion: 'Comedor Local', urgency: 'Baja', estado: 'Despachado', fechaDespacho: new Date(2024, 5, 10), fechaPedido: new Date(2024, 5, 10), valorTotal: 1500, costoTotal: 1200 });
    historicalOrders.push({ ubicacion: 'Pescadería El Ancla', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2024, 6, 28), fechaPedido: new Date(2024, 6, 28), valorTotal: 1800, costoTotal: 1400 });
    // Primavera 2024
    historicalOrders.push({ ubicacion: 'Restaurante El Faro', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2024, 8, 5), fechaPedido: new Date(2024, 8, 5), valorTotal: 5000, costoTotal: 3000 });
    historicalOrders.push({ ubicacion: 'Marisquería VIP', urgency: 'Alta', estado: 'Despachado', fechaDespacho: new Date(2024, 9, 22), fechaPedido: new Date(2024, 9, 22), valorTotal: 11000, costoTotal: 7000 });

    // --- 2025: Año de expansión (Mayor volumen, márgenes optimizados) ---
    // Verano 2025
    historicalOrders.push({ ubicacion: 'Resort Cancún Premium', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2025, 0, 12), fechaPedido: new Date(2025, 0, 12), valorTotal: 25000, costoTotal: 10000 });
    historicalOrders.push({ ubicacion: 'Cadena Hotelera Sur', urgency: 'Alta', estado: 'Despachado', fechaDespacho: new Date(2025, 0, 20), fechaPedido: new Date(2025, 0, 20), valorTotal: 18000, costoTotal: 7500 });
    historicalOrders.push({ ubicacion: 'Distribuidora Central', urgency: 'Baja', estado: 'Despachado', fechaDespacho: new Date(2025, 1, 15), fechaPedido: new Date(2025, 1, 15), valorTotal: 30000, costoTotal: 12000 });
    // Otoño 2025
    historicalOrders.push({ ubicacion: 'Supermercados del Sol', urgency: 'Crítica', estado: 'Despachado', fechaDespacho: new Date(2025, 2, 8), fechaPedido: new Date(2025, 2, 8), valorTotal: 15000, costoTotal: 6000 });
    historicalOrders.push({ ubicacion: 'Restaurante Mar y Tierra', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2025, 3, 18), fechaPedido: new Date(2025, 3, 18), valorTotal: 14000, costoTotal: 5500 });
    historicalOrders.push({ ubicacion: 'Hotel Imperial', urgency: 'Alta', estado: 'Despachado', fechaDespacho: new Date(2025, 4, 22), fechaPedido: new Date(2025, 4, 22), valorTotal: 22000, costoTotal: 8000 });
    // Invierno 2025 (Lograron vender más en veda)
    historicalOrders.push({ ubicacion: 'Mercado Menor', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2025, 5, 15), fechaPedido: new Date(2025, 5, 15), valorTotal: 8000, costoTotal: 4000 });
    historicalOrders.push({ ubicacion: 'Pescadería El Ancla', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2025, 6, 10), fechaPedido: new Date(2025, 6, 10), valorTotal: 6000, costoTotal: 3200 });
    // Primavera 2025
    historicalOrders.push({ ubicacion: 'Centro Logístico Export', urgency: 'Media', estado: 'Despachado', fechaDespacho: new Date(2025, 8, 5), fechaPedido: new Date(2025, 8, 5), valorTotal: 35000, costoTotal: 15000 });
    historicalOrders.push({ ubicacion: 'Marisquería VIP', urgency: 'Alta', estado: 'Despachado', fechaDespacho: new Date(2025, 9, 12), fechaPedido: new Date(2025, 9, 12), valorTotal: 28000, costoTotal: 11000 });

    // Pedidos actuales (Pendientes)
    historicalOrders.push({ ubicacion: 'Puerto Vallarta, Sector A', urgency: 'Crítica', estado: 'Pendiente', valorTotal: 0, costoTotal: 0, fechaPedido: new Date(2025, 4, 10) });
    historicalOrders.push({ ubicacion: 'Centro Logístico Medellín', urgency: 'Alta', estado: 'Pendiente', valorTotal: 0, costoTotal: 0, fechaPedido: new Date(2025, 4, 11) });
    
    await Order.create(historicalOrders);

    // --- SEED SUPPLIES (Abastecimiento de 3ros para costos operativos) ---
    const { default: Supply } = await import('./src/models/Supply.js');
    await Supply.deleteMany({});
    
    const historicalSupplies = [];
    // Costos de terceros 2024
    historicalSupplies.push({ proveedor: 'Pesquera Norte', estado: 'Entregado', eta: 'Recibido', costoTotal: 1500, fechaRecibido: new Date(2024, 0, 10) });
    historicalSupplies.push({ proveedor: 'Logística Marítima', estado: 'Entregado', eta: 'Recibido', costoTotal: 2000, fechaRecibido: new Date(2024, 2, 1) });
    historicalSupplies.push({ proveedor: 'Hielo y Empaque SA', estado: 'Entregado', eta: 'Recibido', costoTotal: 800, fechaRecibido: new Date(2024, 5, 5) });
    historicalSupplies.push({ proveedor: 'Transportes Rápidos', estado: 'Entregado', eta: 'Recibido', costoTotal: 1200, fechaRecibido: new Date(2024, 8, 20) });

    // Costos de terceros 2025
    historicalSupplies.push({ proveedor: 'Pesquera Norte', estado: 'Entregado', eta: 'Recibido', costoTotal: 2500, fechaRecibido: new Date(2025, 0, 8) });
    historicalSupplies.push({ proveedor: 'Logística Marítima', estado: 'Entregado', eta: 'Recibido', costoTotal: 3000, fechaRecibido: new Date(2025, 1, 14) });
    historicalSupplies.push({ proveedor: 'Importaciones Marinas', estado: 'Entregado', eta: 'Recibido', costoTotal: 4500, fechaRecibido: new Date(2025, 3, 5) });
    historicalSupplies.push({ proveedor: 'Hielo y Empaque SA', estado: 'Entregado', eta: 'Recibido', costoTotal: 1000, fechaRecibido: new Date(2025, 5, 1) });
    historicalSupplies.push({ proveedor: 'Transportes Rápidos', estado: 'Entregado', eta: 'Recibido', costoTotal: 1800, fechaRecibido: new Date(2025, 8, 15) });

    // Abastecimientos Pendientes
    historicalSupplies.push({ proveedor: 'Redes Globales', estado: 'Programado', eta: 'Mañana', costoTotal: 500, fechaRecibido: new Date(2025, 4, 12) });
    
    await Supply.create(historicalSupplies);

    console.log('Base de datos sembrada con éxito (CORE DASHBOARD LISTO)');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
