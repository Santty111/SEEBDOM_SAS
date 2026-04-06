import mongoose from 'mongoose';

export const UserRole = Object.freeze({
  Admin: 'admin',
  Operador: 'operador',
});

const ROLES = Object.values(UserRole);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: '{VALUE} no es un rol válido',
      },
      default: UserRole.Operador,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      versionKey: false,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
