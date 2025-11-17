import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc: any, ret: any) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc: any, ret: any) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
});

// Virtual for id field
CategorySchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

// Index for faster queries (name already has unique index from schema definition)
CategorySchema.index({ isActive: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
