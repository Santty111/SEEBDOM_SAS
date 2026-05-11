import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'admin@sebdom.com';
    const pass = 'admin1234';
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('Usuario no encontrado');
      process.exit();
    }
    
    console.log('Usuario encontrado:', user.email);
    console.log('Hash en DB:', user.password);
    
    const match = await bcrypt.compare(pass, user.password);
    console.log('¿Password coincide?:', match);
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
