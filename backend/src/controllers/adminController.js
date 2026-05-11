import Lote from '../models/Lote.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * Controller for Admin Panel - Core Comparativo y de Distribución
 */
const adminController = {
  
  /**
   * REQUERIMIENTO 1: VALIDACIÓN DE BACK-END PARA DATOS SENSIBLES
   * Crea un nuevo Lote con validación estricta de FechaPesca
   */
  createLote: async (req, res) => {
    try {
      const { numeroLote, fechaPesca, productoId, cantidad } = req.body;

      // VALIDACIÓN BACKEND: La FechaPesca no puede ser una fecha en el futuro
      const fechaIngresada = new Date(fechaPesca);
      const hoy = new Date();
      
      if (fechaIngresada > hoy) {
        return res.status(400).json({
          success: false,
          message: 'Error de Validación: La Fecha de Pesca no puede ser una fecha futura.'
        });
      }

      const nuevoLote = await Lote.create({
        numeroLote,
        fechaPesca: fechaIngresada,
        productoId,
        cantidad
      });

      res.status(201).json({
        success: true,
        data: nuevoLote
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * REQUERIMIENTO 1: VALIDACIÓN DE BACK-END PARA DATOS SENSIBLES
   * Crea un nuevo Producto con validación estricta de CostoBase
   */
  createProduct: async (req, res) => {
    try {
      const { nombreProducto, stockActual, unidadMedida, costoBase, categoryId } = req.body;

      // VALIDACIÓN BACKEND: El CostoBase no puede ser negativo ni cero
      if (!costoBase || costoBase <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Error de Validación: El Costo Base debe ser un valor mayor a cero.'
        });
      }

      const nuevoProducto = await Product.create({
        nombreProducto,
        stockActual,
        unidadMedida,
        costoBase,
        categoryId
      });

      res.status(201).json({
        success: true,
        data: nuevoProducto
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * REQUERIMIENTO 2: FORMULARIO CON DROPDOWNS DEPENDIENTES
   * Obtiene todas las categorías para el primer dropdown
   */
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort({ nombre: 1 });
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * REQUERIMIENTO 2: FORMULARIO CON DROPDOWNS DEPENDIENTES
   * Obtiene productos filtrados por categoría para el segundo dropdown
   */
  getProductsByCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        return res.status(400).json({ success: false, message: 'ID de categoría es requerido' });
      }

      const products = await Product.find({ categoryId }).sort({ nombreProducto: 1 });
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default adminController;
