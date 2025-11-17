import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: string;
  name: string;
  slug: string;
  qty: number;
  image: string;
  price: number;
}

export interface ICart extends Document {
  userId?: string;
  sessionCartId: string;
  items: ICartItem[];
  itemsPrice: number;
  totalPrice: number;
  shippingPrice: number;
  taxPrice: number;
  createdAt: Date;
}

const CartItemSchema: Schema = new Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const CartSchema: Schema = new Schema({
  userId: {
    type: String,
    ref: 'User',
    default: null,
  },
  sessionCartId: {
    type: String,
    required: true,
  },
  items: {
    type: [CartItemSchema],
    default: [],
  },
  itemsPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  taxPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
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
CartSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Index for faster queries
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionCartId: 1 });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
