import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

function mapMongooseValidation(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return messages.join('. ') || 'Datos no válidos';
}

/**
 * Middleware global de errores (Express).
 */
export function errorMiddleware(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: mapMongooseValidation(err),
      code: 'VALIDATION',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'El recurso ya existe (duplicado)',
      code: 'DUPLICATE',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      code: 'INVALID_TOKEN',
    });
  }

  console.error('[Error no manejado]', err);

  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    code: 'INTERNAL',
    ...(isDev && { detail: err.message }),
  });
}
