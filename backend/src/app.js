import express from 'express';
import cors from 'cors';
import { buildCorsOptions } from './config/corsOptions.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors(buildCorsOptions()));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sebdom-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Ruta no encontrada', 404, 'NOT_FOUND'));
});

app.use(errorMiddleware);

export default app;
