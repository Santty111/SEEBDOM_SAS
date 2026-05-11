import express from 'express';
import cors from 'cors';
import { buildCorsOptions } from './config/corsOptions.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
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
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Ruta no encontrada', 404, 'NOT_FOUND'));
});

app.use(errorMiddleware);

export default app;
