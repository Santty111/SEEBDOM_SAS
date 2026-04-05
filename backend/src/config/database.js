import mongoose from 'mongoose';

/**
 * @returns {Promise<void>}
 */
export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
