import mongoose from 'mongoose';

/**
 * Dominio equivalente a SEBDOM_SAS.Models.UnidadMedida.
 * @readonly
 */
export const UnidadMedida = Object.freeze({
  Kilogramos: 'Kilogramos',
  Libras: 'Libras',
});

const UNIDAD_VALUES = Object.values(UnidadMedida);

const productSchema = new mongoose.Schema(
  {
    nombreProducto: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      unique: true,
      maxlength: [500, 'El nombre es demasiado largo'],
    },
    stockActual: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    unidadMedida: {
      type: String,
      enum: {
        values: UNIDAD_VALUES,
        message: '{VALUE} no es una unidad de medida válida',
      },
      default: UnidadMedida.Kilogramos,
    },
    costoBase: {
      type: Number,
      required: [true, 'El costo base es obligatorio'],
      min: [0.01, 'El costo base debe ser mayor a cero'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
    toObject: { versionKey: false },
  }
);

productSchema.index({ nombreProducto: 1 });

const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
