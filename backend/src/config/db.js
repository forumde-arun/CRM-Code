
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export default async function connectDB() {
  try {
    const MONGO_URI =
      process.env.MONGO_URI ||
      'mongodb+srv://arun-kumar:Arun-kumar2026@cluster0.vbulgh.mongodb.net/?appName=Cluster0';

    await mongoose.connect(MONGO_URI);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
