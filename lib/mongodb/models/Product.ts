import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: string;
  images: string[];
  description: string;
  price: number;
  costPrice: number;
  priceNeedsReview: boolean;
  lastCostPriceUpdate?: Date;
  weight: number;
  availability: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  isFirstPage: boolean;
  isActive: boolean;
  banner?: string;
  crafter?: string; // Crafter ID
  tags: string[];
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  costPrice: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  priceNeedsReview: {
    type: Boolean,
    default: false,
  },
  lastCostPriceUpdate: {
    type: Date,
    default: null,
  },
  weight: {
    type: Number,
    default: 0,
    min: 0,
  },
  availability: {
    type: Number,
    default: 0,
    min: -1,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isFirstPage: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  banner: {
    type: String,
    default: null,
  },
  crafter: {
    type: Schema.Types.ObjectId,
    ref: 'Crafter',
    default: null,
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
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
ProductSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

// Index for faster queries (slug already has unique index)
ProductSchema.index({ category: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isFirstPage: 1 });
ProductSchema.index({ crafter: 1 });
ProductSchema.index({ tags: 1 });

// Clear the cached model in development to ensure schema changes are picked up
if (mongoose.models.Product) {
  delete mongoose.models.Product;
  delete mongoose.connection.models.Product;
}

const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);

export default ProductModel;
