import mongoose from 'mongoose';

/**
 * Equivale a SEBDOM_SAS.Models.Historial (movimientos de inventario por producto).
 */
const historySchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'productoId es obligatorio'],
      index: true,
    },
    fecha: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    tipoMovimiento: {
      type: String,
      required: [true, 'tipoMovimiento es obligatorio'],
      trim: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: [0, 'La cantidad no puede ser negativa'],
    },
    stockAnterior: {
      type: Number,
      required: true,
    },
    stockNuevo: {
      type: Number,
      required: true,
    },
    notas: {
      type: String,
      trim: true,
      maxlength: [100, 'Las notas no pueden superar 100 caracteres'],
    },
  },
  {
    timestamps: false,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

historySchema.index({ productoId: 1, fecha: -1 });

const History = mongoose.models.History || mongoose.model('History', historySchema);

export default History;
