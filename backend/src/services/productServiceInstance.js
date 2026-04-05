import History from '../models/History.js';
import { createProductService } from './productService.js';

/**
 * Instancia compuesta del dominio de productos con historial persistido (transacciones).
 */
export const productService = createProductService({
  historialModel: History,
});
