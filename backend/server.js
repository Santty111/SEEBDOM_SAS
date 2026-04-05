import 'dotenv/config';
import app from './src/app.js';
import { connectDatabase } from './src/config/database.js';

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`SEBDOM API en http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
