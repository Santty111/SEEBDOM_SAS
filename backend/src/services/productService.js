import mongoose from 'mongoose';
import Product, { UnidadMedida } from '../models/Product.js';

/** Coeficientes alineados con ProductosController (C#). */
const FACTORES_CONVERSION = Object.freeze({
  KILOGRAMOS_A_LIBRAS: 2.20462,
  LIBRAS_A_KILOGRAMOS: 0.453592,
});

// ---------------------------------------------------------------------------
// Funciones puras de dominio (stock / unidades) — testeables sin Mongoose
// ---------------------------------------------------------------------------

/**
 * Convierte el stock numérico al cambiar de unidad (solo Kg ↔ Lb, como en SEBDOM).
 * @param {number} stockActual
 * @param {string} nuevaUnidadMedida - Debe ser Kilogramos o Libras
 * @returns {number}
 */
export function convertirStockAlCambiarUnidad(stockActual, nuevaUnidadMedida) {
  if (nuevaUnidadMedida === UnidadMedida.Libras) {
    return stockActual * FACTORES_CONVERSION.KILOGRAMOS_A_LIBRAS;
  }
  return stockActual * FACTORES_CONVERSION.LIBRAS_A_KILOGRAMOS;
}

/**
 * @param {unknown} value
 * @returns {number | null} Positivo o null si no aplica
 */
export function normalizarCantidadPositiva(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * @param {string} unidadMedida
 */
export function esUnidadMedidaValida(unidadMedida) {
  return Object.values(UnidadMedida).includes(unidadMedida);
}

/**
 * @param {import('mongoose').LeanDocument | null} doc
 */
export function mapearProductoLean(doc) {
  if (!doc) return null;
  const plain = { ...doc };
  if (plain._id) {
    plain.id = plain._id.toString();
    delete plain._id;
  }
  return plain;
}

function mensajeFaltanteStock(falta, unidadMedida) {
  return `El stock actual es menor!\nFaltante = ${falta.toFixed(2)} ${unidadMedida}`;
}

function entradaHistorialAjusteUnidad(producto, stockAnterior, nuevaUnidad) {
  return {
    productoId: producto._id,
    fecha: new Date(),
    tipoMovimiento: 'Ajuste',
    cantidad: 0,
    stockAnterior,
    stockNuevo: stockAnterior,
    notas: `Cambio de unidad de ${producto.unidadMedida} a ${nuevaUnidad}`,
  };
}

function entradaHistorialMovimiento(producto, tipo, cantidad, stockAnterior, stockNuevo, notas) {
  return {
    productoId: producto._id,
    fecha: new Date(),
    tipoMovimiento: tipo,
    cantidad,
    stockAnterior,
    stockNuevo,
    notas,
  };
}

// ---------------------------------------------------------------------------
// Servicio de aplicación (SRP: orquestación de persistencia de productos)
// ---------------------------------------------------------------------------

/**
 * @typedef {import('mongoose').Model} HistorialModel
 */

export class ProductService {
  /**
   * @param {{ productModel?: import('mongoose').Model; historialModel?: HistorialModel | null }} [dependencies]
   */
  constructor(dependencies = {}) {
    this._Product = dependencies.productModel ?? Product;
    this._Historial = dependencies.historialModel ?? null;
  }

  async listProducts() {
    const rows = await this._Product.find().sort({ nombreProducto: 1 }).lean().exec();
    return rows.map(mapearProductoLean);
  }

  async getProductById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this._Product.findById(id).lean().exec();
    return mapearProductoLean(doc);
  }

  /**
   * Alta: nombre, stock 0, unidad Kg, categoryId y costoBase.
   * @param {{ nombreProducto: string, categoryId: string, costoBase: number }} payload
   */
  async createProduct(payload) {
    const cleanName = payload.nombreProducto.trim();
    // Case-insensitive check (BACKEND VALIDATION FOR SENSITIVE DATA)
    const existing = await this._Product.findOne({
      nombreProducto: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    }).lean().exec();
    
    if (existing) {
      const { AppError } = await import('../utils/AppError.js');
      throw new AppError('El producto ya existe con este nombre', 409, 'DUPLICATE_PRODUCT');
    }

    if (!payload.categoryId) {
      const { AppError } = await import('../utils/AppError.js');
      throw new AppError('La categoría es obligatoria', 400, 'MISSING_CATEGORY');
    }

    const doc = await this._Product.create({
      nombreProducto: cleanName,
      stockActual: 0,
      unidadMedida: UnidadMedida.Kilogramos,
      costoBase: payload.costoBase || 1,
      categoryId: payload.categoryId
    });
    return doc.toJSON();
  }

  /**
   * Actualización simple de nombre (sin tocar inventario).
   * @param {string} id
   * @param {{ nombreProducto: string }} payload
   */
  async updateProductName(id, payload) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    
    const cleanName = payload.nombreProducto.trim();
    const existing = await this._Product.findOne({
      _id: { $ne: id },
      nombreProducto: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    }).lean().exec();

    if (existing) {
      const { AppError } = await import('../utils/AppError.js');
      throw new AppError('Ya existe otro producto con este nombre', 409, 'DUPLICATE_PRODUCT');
    }

    const updated = await this._Product.findByIdAndUpdate(
      id,
      { nombreProducto: cleanName },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();
    if (!updated) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    return { ok: true, product: mapearProductoLean(updated) };
  }

  async deleteProduct(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    const deleted = await this._Product.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    return { ok: true, product: mapearProductoLean(deleted) };
  }

  async exists(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const n = await this._Product.countDocuments({ _id: id }).exec();
    return n > 0;
  }

  /**
   * Equivalente a POST Edit de ProductosController: unidad, entrada, salida, historial.
   * @param {string} productId
   * @param {{
   *   unidadMedida: string;
   *   entrada?: number | null;
   *   salida?: number | null;
   *   costoBase?: number | null;
   *   ubicacion?: string;
   * }} dto
   */
  async applyInventoryUpdate(productId, dto) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { ok: false, code: 'NOT_FOUND' };
    }

    if (!esUnidadMedidaValida(dto.unidadMedida)) {
      return { ok: false, code: 'INVALID_UNIT' };
    }

    const entrada = normalizarCantidadPositiva(dto.entrada);
    const salida = normalizarCantidadPositiva(dto.salida);

    const session = this._Historial != null ? await mongoose.startSession() : null;

    const ejecutarActualizacion = async () => {
      const consulta = this._Product.findById(productId);
      const producto = session ? await consulta.session(session) : await consulta;

      if (!producto) {
        return { ok: false, code: 'NOT_FOUND' };
      }

      const stockAnteriorGlobal = producto.stockActual;
      const movimientosHistorial = [];

      if (producto.unidadMedida !== dto.unidadMedida) {
        movimientosHistorial.push(
          entradaHistorialAjusteUnidad(producto, stockAnteriorGlobal, dto.unidadMedida)
        );
        producto.stockActual = convertirStockAlCambiarUnidad(
          producto.stockActual,
          dto.unidadMedida
        );
      }

      producto.unidadMedida = dto.unidadMedida;

      if (entrada != null) {
        if (dto.costoBase != null && dto.costoBase > 0) {
          producto.costoBase = dto.costoBase;
        }
        producto.stockActual += entrada;
        movimientosHistorial.push(
          entradaHistorialMovimiento(
            producto,
            'Entrada',
            entrada,
            stockAnteriorGlobal,
            producto.stockActual,
            'Registro de entrada'
          )
        );
      }

      if (salida != null) {
        if (producto.stockActual < salida) {
          const falta = producto.stockActual - salida;
          return {
            ok: false,
            code: 'INSUFFICIENT_STOCK',
            message: mensajeFaltanteStock(falta, producto.unidadMedida),
            falta,
            unidadMedida: producto.unidadMedida,
          };
        }

        producto.stockActual -= salida;
        movimientosHistorial.push(
          entradaHistorialMovimiento(
            producto,
            'Salida',
            salida,
            stockAnteriorGlobal,
            producto.stockActual,
            'Registro de salida (Enviado a distribución)'
          )
        );

        // Crear alerta de salida (Pedido en estado Pendiente) para Distribución
        const { default: Order } = await import('../models/Order.js');
        const valorCalculado = salida * (producto.costoBase || 0);
        await Order.create([{
          ubicacion: dto.ubicacion || 'Retiro / Mostrador',
          urgencia: 'Media',
          estado: 'Pendiente',
          fechaPedido: new Date(),
          detalles: [{ productoId: producto._id, cantidad: salida }],
          valorTotal: valorCalculado,
          costoTotal: 0
        }], { session });
      }

      if (this._Historial != null && movimientosHistorial.length > 0) {
        await this._Historial.insertMany(movimientosHistorial, { session });
      }

      await producto.save({ session });
      return { ok: true, product: producto.toJSON() };
    };

    try {
      if (session) {
        session.startTransaction();
        try {
          const resultado = await ejecutarActualizacion();
          if (!resultado.ok) {
            await session.abortTransaction();
            return resultado;
          }
          await session.commitTransaction();
          return resultado;
        } catch (err) {
          await session.abortTransaction();
          throw err;
        } finally {
          session.endSession();
        }
      }

      return await ejecutarActualizacion();
    } catch (err) {
      if (err instanceof mongoose.Error.VersionError) {
        const sigue = await this.exists(productId);
        return sigue ? Promise.reject(err) : { ok: false, code: 'NOT_FOUND' };
      }
      throw err;
    }
  }
}

/**
 * @param {{ productModel?: import('mongoose').Model; historialModel?: HistorialModel | null }} [deps]
 */
export function createProductService(deps) {
  return new ProductService(deps);
}

export default ProductService;
