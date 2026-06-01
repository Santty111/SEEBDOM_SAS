import mongoose from 'mongoose';

const currentMovementSchema = new mongoose.Schema(
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
    fecha: {
      type: Date,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['Entrada', 'Salida'],
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
    },
    origen: {
      type: String,
      enum: ['Lote', 'Despacho'],
      required: true,
    },
    referenciaId: {
      type: mongoose.Schema.Types.ObjectId,
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

const CurrentMovement = mongoose.models.CurrentMovement || mongoose.model('CurrentMovement', currentMovementSchema);

export default CurrentMovement;
