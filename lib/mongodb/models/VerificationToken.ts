import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationToken extends Document {
  identifier: string;
  token: string;
  expires: Date;
}

const VerificationTokenSchema: Schema = new Schema({
  identifier: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
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

// Compound index for identifier and token uniqueness
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
VerificationTokenSchema.index({ expires: 1 });

export default mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
