import mongoose from 'mongoose';

const historicalDataSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto asociado es obligatorio'],
    },
    nombreProducto: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    entradas: {
      type: Number,
      required: true,
      min: 0,
    },
    salidas: {
      type: Number,
      required: true,
      min: 0,
    },
    temporada: {
      type: String,
      required: true,
    }
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
  }
);

// Índice compuesto para evitar registros duplicados para el mismo mes/producto/año
historicalDataSchema.index({ productoId: 1, year: 1, month: 1 }, { unique: true });

const HistoricalData = mongoose.models.HistoricalData || mongoose.model('HistoricalData', historicalDataSchema);

export default HistoricalData;
