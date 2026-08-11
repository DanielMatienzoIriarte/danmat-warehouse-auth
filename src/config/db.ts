import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth_service_db';
    await mongoose.connect(mongoURI);

    console.log('DB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}