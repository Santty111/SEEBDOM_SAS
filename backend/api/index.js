import app from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';

let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
      console.log('MongoDB conectado con éxito en Vercel.');
    } catch (err) {
      console.error('Error al conectar a la base de datos en Vercel:', err);
    }
  }
  return app(req, res);
};

export default handler;
