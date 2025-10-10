
import mongoose, { Schema, model, Model, Types } from 'mongoose';

export interface User {
  _id?: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
}, { timestamps: true });

const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) || model<User>('User', UserSchema);

export default UserModel;
