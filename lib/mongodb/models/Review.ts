import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  description: string;
  isVerifiedPurchase: boolean;
  deliveredAt: Date;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  productId: {
    type: String,
    required: true,
    ref: 'Product',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
});

// Virtual for id field
ReviewSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Index for faster queries
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
