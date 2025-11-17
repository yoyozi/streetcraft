import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingAddress {
  fullName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface IPaymentResult {
  id: string;
  status: string;
  email_address: string;
  pricePaid: string;
  currency: string;
  verifiedAt?: Date;
  verificationMethod?: 'webhook' | 'manual' | 'redirect';
  rawResponse?: string; // JSON string of full payment provider response
}

export interface IOrder extends Document {
  userId: string;
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentResult?: IPaymentResult;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  totalPriceUsd?: number;
  exchangeRate?: number;
  eftEmailSent: boolean;
  eftEmailSentAt?: Date;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
}

const ShippingAddressSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
});

const PaymentResultSchema: Schema = new Schema({
  id: { type: String, required: true },
  status: { type: String, required: true },
  email_address: { type: String, required: true },
  pricePaid: { type: String, required: true },
  currency: { type: String, required: true },
  verifiedAt: { type: Date, default: null },
  verificationMethod: { type: String, enum: ['webhook', 'manual', 'redirect'], default: null },
  rawResponse: { type: String, default: null }, // JSON string of full API response
});

const OrderSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  shippingAddress: {
    type: ShippingAddressSchema,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentResult: {
    type: PaymentResultSchema,
    default: null,
  },
  itemsPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  taxPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPriceUsd: {
    type: Number,
    default: null,
  },
  exchangeRate: {
    type: Number,
    default: null,
  },
  eftEmailSent: {
    type: Boolean,
    default: false,
  },
  eftEmailSentAt: {
    type: Date,
    default: null,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
    default: null,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
    default: null,
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
OrderSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

// Virtual populate for order items
OrderSchema.virtual('orderitems', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'orderId',
  justOne: false
});

// Index for faster queries
OrderSchema.index({ userId: 1 });
OrderSchema.index({ isPaid: 1 });
OrderSchema.index({ isDelivered: 1 });
OrderSchema.index({ createdAt: -1 });

// Delete cached model to ensure virtuals are registered (dev mode hot reload issue)
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model<IOrder>('Order', OrderSchema);
