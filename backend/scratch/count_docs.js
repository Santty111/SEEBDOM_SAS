import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const count = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado para contar documentos.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('\n--- Colecciones y cantidades de documentos ---');
    for (const col of collections) {
      const cnt = await db.collection(col.name).countDocuments();
      console.log(`Colección: ${col.name.padEnd(20)} | Documentos: ${cnt}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

count();
