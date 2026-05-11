import mongoose from 'mongoose';

const loteSchema = new mongoose.Schema(
  {
    numeroLote: {
      type: String,
      required: [true, 'El número de lote es obligatorio'],
      unique: true,
    },
    fechaPesca: {
      type: Date,
      required: [true, 'La fecha de pesca es obligatoria'],
    },
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto asociado es obligatorio'],
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
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

const Lote = mongoose.models.Lote || mongoose.model('Lote', loteSchema);

export default Lote;
