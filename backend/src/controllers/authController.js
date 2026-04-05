import * as authService from '../services/authService.js';
import { AppError } from '../utils/AppError.js';

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    if (process.env.DISABLE_REGISTRATION === 'true') {
      throw new AppError('Registro deshabilitado', 403, 'REGISTRATION_DISABLED');
    }
    const user = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (err) {
    next(err);
  }
}
