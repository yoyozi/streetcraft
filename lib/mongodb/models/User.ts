import mongoose, { Schema, Document } from 'mongoose';
import { USER_ROLES } from '@/lib/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified?: Date;
  password?: string;
  image?: string;
  role: string;
  address?: Record<string, unknown> | null; // JSON field
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  requirePasswordReset: boolean;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    default: 'NO_NAME',
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    required: true,
    default: 'user',
    enum: USER_ROLES,
  },
  crafterId: {
    type: Schema.Types.ObjectId,
    ref: 'Crafter',
    default: null,
  },
  address: {
    type: Schema.Types.Mixed,
    default: null,
  },
  paymentMethod: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  requirePasswordReset: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc: IUser & { _id: mongoose.Types.ObjectId }, ret: Record<string, unknown>) {
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Don't include password in JSON
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc: IUser & { _id: mongoose.Types.ObjectId }, ret: Record<string, unknown>) {
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Don't include password in object
      return ret;
    }
  },
});

// Virtual for id field
UserSchema.virtual('id').get(function(this: IUser) {
  return this._id.toString();
});

// Index for faster queries (email already has unique index)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
