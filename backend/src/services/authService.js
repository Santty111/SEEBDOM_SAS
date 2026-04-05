import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const SALT_ROUNDS = 12;

function assertJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta JWT_SECRET en el entorno');
  }
  return secret;
}

function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    role: userDoc.role,
  };
}

/**
 * Registro público: siempre rol operador (evita escalada vía body).
 * @param {{ email: string; password: string }} input
 */
export async function registerUser(input) {
  const email = input.email?.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    throw new AppError('Email y contraseña son obligatorios', 400, 'VALIDATION');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await User.create({
      email,
      password: passwordHash,
      role: UserRole.Operador,
    });
    return toPublicUser(user);
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('El email ya está registrado', 409, 'DUPLICATE_EMAIL');
    }
    throw err;
  }
}

/**
 * @param {{ email: string; password: string }} input
 * @returns {Promise<{ token: string; user: { id: string; email: string; role: string } }>}
 */
export async function loginUser(input) {
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  const secret = assertJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );

  return {
    token,
    user: toPublicUser(user),
  };
}
