import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Season from '../models/Season.js';
import Lote from '../models/Lote.js';
import Supply from '../models/Supply.js';
import CurrentMovement from '../models/CurrentMovement.js';

const adminDashboardController = {
  
  // 1. DISTRIBUCIÓN: Obtener pedidos con ubicación y urgencia
  getDistributionData: async (req, res) => {
    try {
      const pedidos = await Order.find().sort({ createdAt: -1 });
      res.json({ success: true, data: pedidos });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Crear Pedido Manualmente
  createOrder: async (req, res) => {
    try {
      const { ubicacion, urgencia } = req.body;
      const order = await Order.create({
        ubicacion,
        urgencia,
        estado: 'Pendiente',
        fechaPedido: new Date(),
        valorTotal: Math.floor(Math.random() * 10000) + 1000, // Simulando valor
        costoTotal: Math.floor(Math.random() * 5000) + 500   // Simulando costo
      });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Obtener Abastecimientos
  getSupplies: async (req, res) => {
    try {
      const supplies = await Supply.find().sort({ createdAt: -1 });
      res.json({ success: true, data: supplies });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Crear Abastecimiento Manualmente
  createSupply: async (req, res) => {
    try {
      const { proveedor, estado, eta } = req.body;
      const supply = await Supply.create({ proveedor, estado, eta });
      res.status(201).json({ success: true, data: supply });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. ALERTAS: Stock bajo y cuánto cuesta reponer
  getStockAlerts: async (req, res) => {
    try {
      const THRESHOLD = 50; // Umbral de stock bajo
      const products = await Product.find({ stockActual: { $lt: THRESHOLD } });
      
      const alerts = products.map(p => ({
        id: p.id,
        nombre: p.nombreProducto,
        stockActual: p.stockActual,
        faltante: THRESHOLD - p.stockActual,
        costoReposicion: (THRESHOLD - p.stockActual) * (p.costoBase || 0)
      }));

      res.json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. CORE: Comparativa por meses y temporadas de despachos (Rentabilidad)
  getSeasonalComparison: async (req, res) => {
    try {
      // Filtro manual opcional (por año, etc), por defecto todo lo despachado
      const { year } = req.query;
      const matchStage = { estado: 'Despachado', fechaDespacho: { $ne: null } };
      
      if (year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);
        matchStage.fechaDespacho = { $gte: start, $lte: end };
      }

      // Agregamos despachos por mes para calcular rentabilidad
      const stats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $month: "$fechaDespacho" },
            ingresos: { $sum: "$valorTotal" },
            costos: { $sum: "$costoTotal" },
            cantidadDespachos: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      // Agregamos costos de abastecimiento de terceros por mes
      const supplyMatchStage = {};
      if (year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);
        supplyMatchStage.fechaRecibido = { $gte: start, $lte: end };
      }
      const supplyStats = await Supply.aggregate([
        { $match: supplyMatchStage },
        {
          $group: {
            _id: { $month: "$fechaRecibido" },
            costoTerceros: { $sum: "$costoTotal" }
          }
        }
      ]);

      // Mapeamos los meses a sus temporadas usando el modelo Season
      const seasons = await Season.find();
      const comparison = stats.map(s => {
        // Buscar si hay costos de abastecimiento para este mes
        const supMonth = supplyStats.find(sup => sup._id === s._id);
        const costoAbastecimiento = supMonth ? supMonth.costoTerceros : 0;
        const totalCostos = s.costos + costoAbastecimiento;

        // Lógica robusta de temporada (cruza meses o en el mismo año)
        const season = seasons.find(sea => {
          if (sea.mesInicio <= sea.mesFin) {
            return s._id >= sea.mesInicio && s._id <= sea.mesFin;
          } else {
            // Temporada que cruza el año (ej. Dic a Feb -> 12, 1, 2)
            return s._id >= sea.mesInicio || s._id <= sea.mesFin;
          }
        });
        
        const rentabilidad = s.ingresos - totalCostos;
        
        return {
          mes: s._id,
          ingresos: s.ingresos,
          costos: totalCostos,
          costoAbastecimiento: costoAbastecimiento,
          rentabilidad: rentabilidad,
          margen: s.ingresos > 0 ? ((rentabilidad / s.ingresos) * 100).toFixed(2) : 0,
          despachos: s.cantidadDespachos,
          temporada: season ? season.nombre : 'Fuera de Temporada'
        };
      });

      res.json({ success: true, data: comparison });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. DESPACHO: Marcar pedido como enviado y añadir costos operativos
  dispatchOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { costoOperativo = 0 } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      }

      order.estado = 'Despachado';
      order.fechaDespacho = new Date();
      order.costoTotal = Number(costoOperativo);
      await order.save();

      // TRIGGER/VINCULACIÓN: Por cada producto en el pedido, guardar salida en current_movements si es en 2026
      if (order.fechaDespacho.getFullYear() === 2026) {
        for (const item of order.detalles) {
          const prod = await Product.findById(item.productoId);
          await CurrentMovement.create({
            productoId: item.productoId,
            nombreProducto: prod ? prod.nombreProducto : 'Producto Desconocido',
            fecha: order.fechaDespacho,
            tipo: 'Salida',
            cantidad: item.cantidad,
            origen: 'Despacho',
            referenciaId: order._id
          });
        }
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default adminDashboardController;
