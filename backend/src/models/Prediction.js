import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
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
    yearBase: {
      type: Number,
      required: true,
    },
    yearObjetivo: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    entradasProyectadas: {
      type: Number,
      required: true,
      min: 0,
    },
    salidasProyectadas: {
      type: Number,
      required: true,
      min: 0,
    },
    temporada: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Calculado', 'Bloqueado'],
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

// Indice compuesto único para evitar duplicación del mismo par base/objetivo, mes y producto
predictionSchema.index({ productoId: 1, yearBase: 1, yearObjetivo: 1, month: 1 }, { unique: true });

const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', predictionSchema);

export default Prediction;
