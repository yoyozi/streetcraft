import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: string;
  productId: string;
  qty: number;
  price: number;
  name: string;
  slug: string;
  image: string;
}

const OrderItemSchema: Schema = new Schema({
  orderId: {
    type: String,
    required: true,
    ref: 'Order',
  },
  productId: {
    type: String,
    required: true,
    ref: 'Product',
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  image: {
    type: String,
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
OrderItemSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Compound index for order uniqueness
OrderItemSchema.index({ orderId: 1, productId: 1 }, { unique: true });
OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });

export default mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
