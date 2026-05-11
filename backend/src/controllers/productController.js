import { productService } from '../services/productServiceInstance.js';
import { AppError } from '../utils/AppError.js';

function ensureNombre(body) {
  const nombre = body?.nombreProducto?.trim();
  if (!nombre) {
    throw new AppError('nombreProducto es obligatorio', 400, 'VALIDATION');
  }
  return nombre;
}

/**
 * GET /api/products
 */
export async function listProducts(_req, res, next) {
  try {
    const products = await productService.listProducts();
    res.json({ success: true, data: { products } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 */
export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products
 */
export async function createProduct(req, res, next) {
  try {
    const nombreProducto = ensureNombre(req.body);
    const product = await productService.createProduct({ nombreProducto });
    res.status(201).json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/products/:id — solo nombre
 */
export async function updateProductName(req, res, next) {
  try {
    const nombreProducto = ensureNombre(req.body);
    const result = await productService.updateProductName(req.params.id, {
      nombreProducto,
    });
    if (!result.ok) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { product: result.product } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/products/:id/inventory — unidad, entrada, salida (lógica en servicio)
 */
export async function updateInventory(req, res, next) {
  try {
    const { unidadMedida, entrada, salida, costoBase, ubicacion } = req.body;
    if (unidadMedida == null) {
      throw new AppError('unidadMedida es obligatorio', 400, 'VALIDATION');
    }

    const result = await productService.applyInventoryUpdate(req.params.id, {
      unidadMedida,
      entrada,
      salida,
      costoBase,
      ubicacion,
    });

    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
      }
      if (result.code === 'INVALID_UNIT') {
        throw new AppError('Unidad de medida no válida', 400, 'INVALID_UNIT');
      }
      if (result.code === 'INSUFFICIENT_STOCK') {
        return res.status(409).json({
          success: false,
          message: result.message,
          code: result.code,
          data: {
            falta: result.falta,
            unidadMedida: result.unidadMedida,
          },
        });
      }

      throw new AppError('No se pudo actualizar el inventario', 400, result.code || 'UPDATE_FAILED');
    }

    res.json({ success: true, data: { product: result.product } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:id
 */
export async function removeProduct(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.params.id);
    if (!result.ok) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { product: result.product } });
  } catch (err) {
    next(err);
  }
}
