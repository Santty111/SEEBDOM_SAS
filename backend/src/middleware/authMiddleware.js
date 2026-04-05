import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

/**
 * Verifica Bearer JWT y adjunta `req.auth` con payload decodificado.
 */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401, 'NO_TOKEN'));
  }

  const token = header.slice(7).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error('JWT_SECRET no configurado'));
  }

  try {
    const payload = jwt.verify(token, secret);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return next(new AppError('Token inválido o expirado', 401, 'INVALID_TOKEN'));
  }
}
