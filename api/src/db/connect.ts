
import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.log('ℹ️ MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
}

export async function closeDB() {
  await mongoose.disconnect();
}
