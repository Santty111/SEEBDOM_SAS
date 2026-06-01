import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';
import User from './src/models/User.js';
import Season from './src/models/Season.js';
import Order from './src/models/Order.js';
import Lote from './src/models/Lote.js';
import Supply from './src/models/Supply.js';
import HistoricalData from './src/models/HistoricalData.js';
import CurrentMovement from './src/models/CurrentMovement.js';
import Prediction from './src/models/Prediction.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Limpiar colecciones
    await Category.deleteMany({});
    await User.deleteMany({});
    await Season.deleteMany({});
    await Product.deleteMany({});
    await Lote.deleteMany({});
    await Order.deleteMany({});
    await Supply.deleteMany({});
    await HistoricalData.deleteMany({});
    await CurrentMovement.deleteMany({});
    await Prediction.deleteMany({});

    try {
      await Prediction.collection.dropIndexes();
    } catch (err) {
      console.log('No predictions indexes to drop.');
    }

    // Crear Usuarios de Prueba
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

    console.log('Usuarios creados con éxito');

    const cat1 = await Category.create({ nombre: 'Mariscos Frescos' });
    const cat2 = await Category.create({ nombre: 'Congelados' });

    // --- SEED SEASONS ---
    const seasonsList = [
      { nombre: 'Temporada de Veda (Invierno)', mesInicio: 6, mesFin: 8, descripcion: 'Baja producción' },
      { nombre: 'Temporada Alta (Verano)', mesInicio: 12, mesFin: 2, descripcion: 'Máxima demanda' },
      { nombre: 'Cosecha Media (Otoño)', mesInicio: 3, mesFin: 5, descripcion: 'Estabilidad' },
      { nombre: 'Cosecha Media (Primavera)', mesInicio: 9, mesFin: 11, descripcion: 'Estabilidad' }
    ];
    await Season.create(seasonsList);

    const getSeasonForMonth = (month) => {
      const season = seasonsList.find(sea => {
        if (sea.mesInicio <= sea.mesFin) {
          return month >= sea.mesInicio && month <= sea.mesFin;
        } else {
          return month >= sea.mesInicio || month <= sea.mesFin;
        }
      });
      return season ? season.nombre : 'Fuera de Temporada';
    };

    // --- SEED PRODUCTS ---
    const prod1 = await Product.create({
      nombreProducto: 'Pulpo de Roca Premium',
      stockActual: 70,
      costoBase: 15.5,
      categoryId: cat1._id,
      unidadMedida: 'Kilogramos'
    });

    const prod2 = await Product.create({
      nombreProducto: 'Anillos de Calamar XL',
      stockActual: 85,
      costoBase: 12.0,
      categoryId: cat2._id,
      unidadMedida: 'Kilogramos'
    });

    // --- SEED HISTORICAL DATA (Tabla 1) para 2024 y 2025 ---
    const historicalDatasToInsert = [];
    const monthlyPulpo2024 = [
      { month: 1, entry: 800, exit: 500 },
      { month: 2, entry: 700, exit: 450 },
      { month: 3, entry: 600, exit: 400 },
      { month: 4, entry: 550, exit: 380 },
      { month: 5, entry: 580, exit: 420 },
      { month: 6, entry: 1000, exit: 800 },
      { month: 7, entry: 1200, exit: 950 },
      { month: 8, entry: 1100, exit: 900 },
      { month: 9, entry: 850, exit: 600 },
      { month: 10, entry: 800, exit: 550 },
      { month: 11, entry: 830, exit: 580 },
      { month: 12, entry: 900, exit: 650 }
    ];

    const monthlyPulpo2025 = [
      { month: 1, entry: 900, exit: 550 },
      { month: 2, entry: 800, exit: 500 },
      { month: 3, entry: 700, exit: 450 },
      { month: 4, entry: 650, exit: 400 },
      { month: 5, entry: 680, exit: 450 },
      { month: 6, entry: 1200, exit: 900 },
      { month: 7, entry: 1400, exit: 1100 },
      { month: 8, entry: 1300, exit: 1000 },
      { month: 9, entry: 950, exit: 700 },
      { month: 10, entry: 900, exit: 650 },
      { month: 11, entry: 930, exit: 680 },
      { month: 12, entry: 1000, exit: 750 }
    ];

    const monthlyCalamar2024 = [
      { month: 1, entry: 500, exit: 300 },
      { month: 2, entry: 450, exit: 280 },
      { month: 3, entry: 400, exit: 250 },
      { month: 4, entry: 380, exit: 240 },
      { month: 5, entry: 420, exit: 260 },
      { month: 6, entry: 600, exit: 450 },
      { month: 7, entry: 700, exit: 550 },
      { month: 8, entry: 650, exit: 500 },
      { month: 9, entry: 500, exit: 350 },
      { month: 10, entry: 480, exit: 320 },
      { month: 11, entry: 510, exit: 340 },
      { month: 12, entry: 550, exit: 380 }
    ];

    const monthlyCalamar2025 = [
      { month: 1, entry: 600, exit: 350 },
      { month: 2, entry: 550, exit: 320 },
      { month: 3, entry: 500, exit: 300 },
      { month: 4, entry: 480, exit: 290 },
      { month: 5, entry: 520, exit: 320 },
      { month: 6, entry: 800, exit: 550 },
      { month: 7, entry: 900, exit: 650 },
      { month: 8, entry: 850, exit: 600 },
      { month: 9, entry: 600, exit: 400 },
      { month: 10, entry: 580, exit: 380 },
      { month: 11, entry: 610, exit: 400 },
      { month: 12, entry: 650, exit: 450 }
    ];

    // Poblar 2024 Pulpo
    monthlyPulpo2024.forEach(item => {
      historicalDatasToInsert.push({
        productoId: prod1._id,
        nombreProducto: prod1.nombreProducto,
        year: 2024,
        month: item.month,
        entradas: item.entry,
        salidas: item.exit,
        temporada: getSeasonForMonth(item.month)
      });
    });

    // Poblar 2025 Pulpo
    monthlyPulpo2025.forEach(item => {
      historicalDatasToInsert.push({
        productoId: prod1._id,
        nombreProducto: prod1.nombreProducto,
        year: 2025,
        month: item.month,
        entradas: item.entry,
        salidas: item.exit,
        temporada: getSeasonForMonth(item.month)
      });
    });

    // Poblar 2024 Calamar
    monthlyCalamar2024.forEach(item => {
      historicalDatasToInsert.push({
        productoId: prod2._id,
        nombreProducto: prod2.nombreProducto,
        year: 2024,
        month: item.month,
        entradas: item.entry,
        salidas: item.exit,
        temporada: getSeasonForMonth(item.month)
      });
    });

    // Poblar 2025 Calamar
    monthlyCalamar2025.forEach(item => {
      historicalDatasToInsert.push({
        productoId: prod2._id,
        nombreProducto: prod2.nombreProducto,
        year: 2025,
        month: item.month,
        entradas: item.entry,
        salidas: item.exit,
        temporada: getSeasonForMonth(item.month)
      });
    });

    await HistoricalData.create(historicalDatasToInsert);
    console.log('Tabla 1 (Históricos 2024-2025) sembrada');

    // --- SEED CURRENT MOVEMENTS (Tabla 2) para 2026 Ene-May ---
    const currentMovementsToInsert = [];
    const pulpo2026Real = [
      { month: 1, entry: 1100, exit: 700 },
      { month: 2, entry: 1000, exit: 650 },
      { month: 3, entry: 900, exit: 600 },
      { month: 4, entry: 850, exit: 550 },
      { month: 5, entry: 880, exit: 600 }
    ];

    const calamar2026Real = [
      { month: 1, entry: 700, exit: 450 },
      { month: 2, entry: 650, exit: 400 },
      { month: 3, entry: 600, exit: 380 },
      { month: 4, entry: 580, exit: 360 },
      { month: 5, entry: 620, exit: 400 }
    ];

    // Sembrar Pulpo 2026
    pulpo2026Real.forEach(item => {
      const refId = new mongoose.Types.ObjectId();
      currentMovementsToInsert.push({
        productoId: prod1._id,
        nombreProducto: prod1.nombreProducto,
        fecha: new Date(2026, item.month - 1, 15),
        tipo: 'Entrada',
        cantidad: item.entry,
        origen: 'Lote',
        referenciaId: refId
      });
      currentMovementsToInsert.push({
        productoId: prod1._id,
        nombreProducto: prod1.nombreProducto,
        fecha: new Date(2026, item.month - 1, 15),
        tipo: 'Salida',
        cantidad: item.exit,
        origen: 'Despacho',
        referenciaId: refId
      });
    });

    // Sembrar Calamar 2026
    calamar2026Real.forEach(item => {
      const refId = new mongoose.Types.ObjectId();
      currentMovementsToInsert.push({
        productoId: prod2._id,
        nombreProducto: prod2.nombreProducto,
        fecha: new Date(2026, item.month - 1, 15),
        tipo: 'Entrada',
        cantidad: item.entry,
        origen: 'Lote',
        referenciaId: refId
      });
      currentMovementsToInsert.push({
        productoId: prod2._id,
        nombreProducto: prod2.nombreProducto,
        fecha: new Date(2026, item.month - 1, 15),
        tipo: 'Salida',
        cantidad: item.exit,
        origen: 'Despacho',
        referenciaId: refId
      });
    });

    await CurrentMovement.create(currentMovementsToInsert);
    console.log('Tabla 2 (Data Actual 2026 Ene-May) sembrada');

    // --- SEED SUPPLIES ---
    const historicalSupplies = [
      { proveedor: 'Pesquera Norte', estado: 'Entregado', eta: 'Recibido', costoTotal: 1500, fechaRecibido: new Date(2024, 0, 10) },
      { proveedor: 'Logística Marítima', estado: 'Entregado', eta: 'Recibido', costoTotal: 2000, fechaRecibido: new Date(2024, 2, 1) },
      { proveedor: 'Hielo y Empaque SA', estado: 'Entregado', eta: 'Recibido', costoTotal: 800, fechaRecibido: new Date(2024, 5, 5) },
      { proveedor: 'Transportes Rápidos', estado: 'Entregado', eta: 'Recibido', costoTotal: 1200, fechaRecibido: new Date(2024, 8, 20) },
      { proveedor: 'Pesquera Norte', estado: 'Entregado', eta: 'Recibido', costoTotal: 2500, fechaRecibido: new Date(2025, 0, 8) },
      { proveedor: 'Logística Marítima', estado: 'Entregado', eta: 'Recibido', costoTotal: 3000, fechaRecibido: new Date(2025, 1, 14) },
      { proveedor: 'Importaciones Marinas', estado: 'Entregado', eta: 'Recibido', costoTotal: 4500, fechaRecibido: new Date(2025, 3, 5) },
      { proveedor: 'Hielo y Empaque SA', estado: 'Entregado', eta: 'Recibido', costoTotal: 1000, fechaRecibido: new Date(2025, 5, 1) },
      { proveedor: 'Transportes Rápidos', estado: 'Entregado', eta: 'Recibido', costoTotal: 1800, fechaRecibido: new Date(2025, 8, 15) },
      { proveedor: 'Redes Globales', estado: 'Programado', eta: 'Mañana', costoTotal: 500, fechaRecibido: new Date(2026, 4, 12) }
    ];
    await Supply.create(historicalSupplies);
    console.log('Tabla de Abastecimientos sembrada');

    console.log('Sembrado finalizado exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante el sembrado:', err);
    process.exit(1);
  }
};

seed();
