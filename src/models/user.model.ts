import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  user_id: string;
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  created_at: Date;
}

const userSchema = new Schema<IUser> ({
  user_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] 
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client'], required: true, default: 'client' },
  created_at: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', userSchema);