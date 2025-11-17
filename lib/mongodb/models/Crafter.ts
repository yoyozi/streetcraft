import mongoose, { Schema, Document } from 'mongoose';

export interface ICrafter extends Document {
  name: string;
  location: string;
  mobile: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CrafterSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc: ICrafter & { _id: mongoose.Types.ObjectId }, ret: Record<string, unknown>) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc: ICrafter & { _id: mongoose.Types.ObjectId }, ret: Record<string, unknown>) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
});

// Virtual for id field
CrafterSchema.virtual('id').get(function(this: ICrafter & { _id: mongoose.Types.ObjectId }) {
  return this._id.toString();
});

// Index for faster queries
CrafterSchema.index({ name: 1 });
CrafterSchema.index({ location: 1 });
CrafterSchema.index({ mobile: 1 });
CrafterSchema.index({ isActive: 1 });

export default mongoose.models.Crafter || mongoose.model<ICrafter>('Crafter', CrafterSchema);
