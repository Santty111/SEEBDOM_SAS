import mongoose from 'mongoose';

const supplySchema = new mongoose.Schema(
  {
    proveedor: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ['Programado', 'En Ruta', 'Entregado'],
      default: 'Programado',
    },
    eta: {
      type: String, // ej: "2h", "Mañana", "15 de Mayo"
      required: true,
    },
    costoTotal: {
      type: Number,
      default: 0
    },
    fechaRecibido: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Supply = mongoose.models.Supply || mongoose.model('Supply', supplySchema);
export default Supply;
