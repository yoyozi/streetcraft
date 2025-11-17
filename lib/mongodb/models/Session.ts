import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  expires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for faster queries (sessionToken already has unique index)
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expires: 1 });

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
