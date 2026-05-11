import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    ubicacion: {
      type: String,
      required: [true, 'La ubicación es obligatoria'],
    },
    fechaPedido: {
      type: Date,
      default: Date.now,
    },
    urgencia: {
      type: String,
      enum: ['Baja', 'Media', 'Alta', 'Crítica'],
      default: 'Media',
    },
    estado: {
      type: String,
      enum: ['Pendiente', 'Despachado', 'Cancelado'],
      default: 'Pendiente',
    },
    detalles: [
      {
        productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        cantidad: Number,
      }
    ],
    fechaDespacho: {
      type: Date,
    },
    valorTotal: {
      type: Number,
      default: 0
    },
    costoTotal: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
