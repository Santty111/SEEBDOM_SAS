import express from 'express';
import adminController from '../controllers/adminController.js';
import adminDashboardController from '../controllers/adminDashboardController.js';
import prediccionController from '../controllers/prediccionController.js';
import { requireAuth, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de admin requieren ser administrador
router.use(requireAuth);
router.use(restrictTo('admin'));

// Rutas de Gestión
router.post('/lotes', adminController.createLote);
router.post('/productos', adminController.createProduct);

// Rutas de Dashboard Core (Requerimientos Nuevos)
router.get('/dashboard/distribucion', adminDashboardController.getDistributionData);
router.post('/dashboard/pedidos', adminDashboardController.createOrder); // NUEVO
router.get('/dashboard/alertas', adminDashboardController.getStockAlerts);
router.get('/dashboard/comparativa', adminDashboardController.getSeasonalComparison);
router.patch('/dashboard/despacho/:orderId', adminDashboardController.dispatchOrder);
router.get('/dashboard/abastecimiento', adminDashboardController.getSupplies); // NUEVO
router.post('/dashboard/abastecimiento', adminDashboardController.createSupply); // NUEVO
router.post('/dashboard/predicciones/calcular', prediccionController.calcularCruce); // NUEVO
router.get('/dashboard/predicciones/comparar', prediccionController.obtenerComparacion); // NUEVO

// Rutas para Requerimiento 2: Dropdowns Dependientes
router.get('/categorias', adminController.getCategories);
router.get('/productos/categoria/:categoryId', adminController.getProductsByCategory);

export default router;
