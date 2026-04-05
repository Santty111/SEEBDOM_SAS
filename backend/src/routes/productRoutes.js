import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', productController.listProducts);
router.post('/', productController.createProduct);
router.patch('/:id/inventory', productController.updateInventory);
router.patch('/:id', productController.updateProductName);
router.get('/:id', productController.getProduct);
router.delete('/:id', productController.removeProduct);

export default router;
