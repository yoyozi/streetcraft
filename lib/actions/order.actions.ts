'use server'

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { connectDB, Order, OrderItem, Product, User, Cart } from '../mongodb/models';
import { CartItem, Order as OrderType, ShippingAddress, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { initializePaystackTransaction, verifyPaystackTransaction } from "../paystack";
// to revalidate the data on the page
import { revalidatePath } from 'next/cache';  
import { PAGE_SIZE } from "../constants";
// import { Prisma } from "@prisma/client";
import { sendPurchaseReceipt } from "@/email/send-purchase-receipts";
import { sendEftPaymentInstructions } from "@/email/send-eft-payment-instructions";
import { createYocoCheckout, verifyYocoPayment } from "../yoco";

/**
 * Fetches the current USD/ZAR exchange rate from ExchangeRate-API
 * @returns The exchange rate (how many ZAR per 1 USD)
 * Falls back to 17.3 if API call fails
 */
async function getRandDolarRate(): Promise<number> {
  try {
    // Using ExchangeRate-API (free tier: 1,500 requests/month)
    // Alternative: https://api.exchangerate-api.com/v4/latest/USD
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      // console.error('[EXCHANGE_RATE] API request failed:', response.status);
      return 17.3; // Fallback rate
    }

    const data = await response.json();
    const zarRate = data.rates?.ZAR;

    if (!zarRate || typeof zarRate !== 'number') {
      // console.error('[EXCHANGE_RATE] Invalid ZAR rate in response:', data);
      return 17.3; // Fallback rate
    }

    // console.log('[EXCHANGE_RATE] Current USD to ZAR rate:', zarRate);
    return zarRate;

  } catch (error) {
    // console.error('[EXCHANGE_RATE] Error fetching exchange rate:', error);
    return 17.3; // Fallback rate
  }
}

// Creates the order and the order items (items in the order)
export async function createOrder() {
    try {

        const session = await auth();
        if(!session) throw new Error("User not Authenticated");
            
        const userId = session?.user?.id;
        if(!userId) throw new Error("User id not found");

        const user = await getUserById(userId);
        if(!user) throw new Error("User not found");

        const cart = await getMyCart();

        if(!cart || cart.items.length === 0) {
            return {success: false, message: "Your cart is empty", redirectTo: '/cart'};
        }

        if(!user.address) {
            return {success: false, message: "No shipping address", redirectTo: '/shipping-address'};
        }


        if(!user.paymentMethod) {
            return {success: false, message: "No payment method", redirectTo: '/payment-method'};
        }


        // create the order object
        const order = insertOrderSchema.parse({
          userId: user.id,
          shippingAddress: user.address,
          paymentMethod: user.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        });

        // Create the order (without transaction for local dev)
        // NOTE: Transactions require MongoDB replica set. For production, consider enabling transactions.
        let insertedOrderId: string | null = null;
        
        try {
            // Create the order
            const insertedOrder = await Order.create(order);
            insertedOrderId = insertedOrder.id;

            // Create the order items from the cart items
            for (const item of cart.items as CartItem[]) {
                await OrderItem.create({
                    ...item,
                    price: item.price,
                    orderId: insertedOrderId,
                });
            }

            // clear the cart after adding it into items ordered
            await Cart.findByIdAndUpdate(cart.id, {
                items: [],
                totalPrice: 0,
                taxPrice: 0,
                shippingPrice: 0,
                itemsPrice: 0,
            });
        } catch (error) {
            // If order creation fails, try to clean up
            if (insertedOrderId) {
                try {
                    await Order.findByIdAndDelete(insertedOrderId);
                    await OrderItem.deleteMany({ orderId: insertedOrderId });
                } catch (cleanupError) {
                    // console.error('Failed to cleanup after order creation error:', cleanupError);
                }
            }
            throw error;
        }

        
        if(!insertedOrderId) throw new Error("Order not created");

        // Send EFT payment instructions email immediately after order creation
        if(user.paymentMethod === 'EFT') {
          try {
            // Get the full order with items to send in email
            const fullOrder = await getOrderById(insertedOrderId);
            
            if (fullOrder) {
              await sendEftPaymentInstructions({ order: fullOrder });
              
              // Update order to mark that EFT email was sent
              await Order.findByIdAndUpdate(insertedOrderId, {
                eftEmailSent: true,
                eftEmailSentAt: new Date(),
              });
              
              // console.log(`EFT payment instructions sent to ${user.email} for order ${insertedOrderId}`);
            }
          } catch (emailError) {
            // console.error('Failed to send EFT payment instructions:', emailError);
            // Don't throw - we don't want email failures to break the order creation
          }
        }

        return {success: true, message: "Order created", redirectTo: `/order/${insertedOrderId}`};

    } catch (error) {
      if (isRedirectError(error)) throw error;
      // console.error("[ORDER ACTIONS] Create order exception:", error);
        return { success: false, message: "An error occurred while creating the order" };
    }
}



// Get the order by ID
export async function getOrderById(orderId: string): Promise<OrderType | null> {
    await connectDB();
    const data = await Order.findById(orderId)
        .populate({
            path: 'orderitems',
            populate: {
                path: 'productId',
                select: 'name slug image'
            }
        })
        .populate('userId', 'name email')
        .exec();

    if (!data) return null;

    // Normalize MongoDB result to match expected Order type
    const normalized: OrderType = {
        id: data.id,
        createdAt: data.createdAt,
        isPaid: data.isPaid,
        paidAt: data.paidAt,
        isDelivered: data.isDelivered,
        deliveredAt: data.deliveredAt,
        user: { name: (data.userId as any)?.name ?? "", email: (data.userId as any)?.email ?? "" },
        orderItems: data.orderitems.map((oi: any) => ({
            productId: oi.productId,
            slug: oi.slug,
            image: oi.image,
            name: oi.name,
            price: oi.price.toString(),
            qty: oi.qty,
        })),
        userId: data.userId,
        itemsPrice: data.itemsPrice.toString(),
        shippingPrice: data.shippingPrice.toString(),
        taxPrice: data.taxPrice.toString(),
        totalPrice: data.totalPrice.toString(),
        totalPriceUsd: data.totalPriceUsd?.toString(),
        exchangeRate: data.exchangeRate?.toString(),
        eftEmailSent: data.eftEmailSent,
        eftEmailSentAt: data.eftEmailSentAt,
        paymentMethod: data.paymentMethod,
        shippingAddress: data.shippingAddress as unknown as ShippingAddress,
        paymentResult: data.paymentResult as PaymentResult,
    };

    // Ensure plain JSON-safe object for serialization when passed to client
    return convertToPlainObject(normalized);
}



// Create a new Paypal order
// Narrow return type so data is guaranteed when success is true
type CreatePayPalOrderResponse =
  | { success: true; message: string; data: string }
  | { success: false; message: string };

export async function createPayPalOrder(orderId: string): Promise<CreatePayPalOrderResponse> {
    try {
      await connectDB();
      // Get order from database
      const order = await Order.findById(orderId);
      if (order) {

        // Get the R $ rate
        const rate = await getRandDolarRate();
        // console.log("Using the exchange rate of: " + rate)

        // Get amount in dollars
        const totalPriceInUsd = round2(Number(order.totalPrice) / rate);

        // Create a paypal order
        const paypalOrder = await paypal.createOrder(totalPriceInUsd);
  
        // Update the order with the paypal order id, USD amount, and exchange rate
        await Order.findByIdAndUpdate(orderId, {
          totalPriceUsd: totalPriceInUsd,
          totalPrice: order.totalPrice,
          exchangeRate: rate,
          paymentResult: {
            id: paypalOrder.id,
            email_address: '',
            status: '',
            pricePaid: '0',
            currency: 'USD',
          },
        });
  
        // Return the paypal order id
        return {
          success: true,
          message: 'PayPal order created successfully',
          data: paypalOrder.id,
        };
      } else {
        throw new Error('Order not found');
      }
    } catch (err) {
      return { success: false, message: formatError(err).message };
    }
}



// Approve Paypal Order
export async function approvePayPalOrder(
    orderId: string,
    data: { orderID: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await connectDB();
      // Find the order in the database
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found')
  
      // Check if the order is already paid
      const captureData = await paypal.capturePayment(data.orderID)
      if (
        !captureData ||
        captureData.id !== (order.paymentResult as PaymentResult)?.id ||
        captureData.status !== 'COMPLETED'
      )
    throw new Error('Error in paypal payment')
  
    //   Update order to paid
    await updateOrderToPaid({
        orderId,
        paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        currency: 'USD',
        },
    });
  
    revalidatePath(`/order/${orderId}`)

    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}


// ============================================
// PAYSTACK PAYMENT FUNCTIONS
// ============================================

type CreatePaystackOrderResponse =
  | { success: true; message: string; authorization_url: string }
  | { success: false; message: string };

/**
 * Initialize Paystack payment for an order
 * @param orderId - The order ID to create payment for
 */
export async function createPaystackOrder(orderId: string): Promise<CreatePaystackOrderResponse> {
  try {
    await connectDB();
    // Get order from database
    const order = await Order.findById(orderId)
      .populate('userId', 'email')
      .exec();

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.isPaid) {
      return { success: false, message: 'Order is already paid' };
    }

    // Initialize Paystack transaction with unique reference
    // Append timestamp to avoid duplicate reference errors
    const uniqueReference = `${orderId}-${Date.now()}`;
    
    const paystackResponse = await initializePaystackTransaction({
      email: (order.userId as any)?.email || '',
      amount: Number(order.totalPrice),
      reference: uniqueReference,
      orderId: orderId, // Pass clean order ID for callback URL
    });

    if (paystackResponse.success) {
      // Store the Paystack reference in the order
      await Order.findByIdAndUpdate(orderId, {
        paymentResult: {
          id: uniqueReference,
          status: 'pending',
          email_address: (order.userId as any)?.email || '',
        },
      });

      return {
        success: true,
        message: 'Paystack payment initialized',
        authorization_url: paystackResponse.authorization_url,
      };
    }

    return { success: false, message: 'Failed to initialize Paystack payment' };
  } catch (err) {
    // console.error('[PAYSTACK] Create order error:', err);
    return { success: false, message: formatError(err).message };
  }
}

/**
 * Verify Paystack payment and update order
 * @param orderId - The order ID to verify payment for
 */
export async function verifyPaystackPayment(orderId: string) {
  try {
    await connectDB();
    // Get the order to retrieve the Paystack reference
    const order = await Order.findById(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // If order is already paid (webhook processed it), just return success
    if (order.isPaid) {
      // console.log('[PAYSTACK] Order already paid, skipping verification');
      return { success: true, message: 'Payment already verified' };
    }

    // Get the Paystack reference from paymentResult
    // If status is 'pending', it's the reference we stored. Otherwise it's been updated by webhook.
    const paymentResult = order.paymentResult as { status?: string; id?: string } | null;
    const paystackReference = (paymentResult?.status === 'pending' 
      ? paymentResult.id 
      : orderId) || orderId;
    
    // console.log('[PAYSTACK] Verifying payment with reference:', paystackReference);

    // Verify the transaction with Paystack
    const verificationResponse = await verifyPaystackTransaction(paystackReference);

    if (!verificationResponse.success || !verificationResponse.data) {
      return { success: false, message: 'Payment verification failed' };
    }

    const { data } = verificationResponse;

    // Update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: data.id,
        status: data.status,
        email_address: data.customer.email,
        pricePaid: data.amount.toString(),
        currency: 'ZAR',
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been successfully paid via Paystack',
    };
  } catch (err) {
    // console.error('[PAYSTACK] Verify payment error:', err);
    return { success: false, message: formatError(err).message };
  }
}


// ============================================
// YOCO PAYMENT FUNCTIONS
// ============================================

type CreateYocoOrderResponse =
  | { success: true; message: string; redirectUrl: string }
  | { success: false; message: string };

/**
 * Initialize Yoco payment for an order
 * @param orderId - The order ID to create payment for
 */
export async function createYocoOrder(orderId: string): Promise<CreateYocoOrderResponse> {
  try {
    await connectDB();
    // Get order from database
    const order = await Order.findById(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.isPaid) {
      return { success: false, message: 'Order is already paid' };
    }

    // Create Yoco checkout
    const yocoResponse = await createYocoCheckout({
      amount: Number(order.totalPrice),
      metadata: {
        orderId: orderId,
        orderNumber: order.id,
      },
    });

    if (yocoResponse.success) {
      // Store checkout ID in order for verification later
      await Order.findByIdAndUpdate(orderId, {
        // You might want to add a yocoCheckoutId field to your schema
        // For now, we'll use the payment result to store it temporarily
        paymentResult: {
          id: yocoResponse.checkoutId,
          status: 'pending',
          email_address: '',
          pricePaid: '0',
          currency: 'ZAR',
        } as unknown as object,
      });

      return {
        success: true,
        message: 'Yoco checkout created',
        redirectUrl: yocoResponse.redirectUrl,
      };
    }

    return { success: false, message: 'Failed to create Yoco checkout' };
  } catch (err) {
    // console.error('[YOCO] Create order error:', err);
    return { success: false, message: formatError(err).message };
  }
}

/**
 * Verify Yoco payment and update order
 * @param orderId - The order ID to verify payment for
 */
export async function verifyYocoOrder(orderId: string) {
  try {
    // console.log('[YOCO] Starting verification for order:', orderId);
    
    await connectDB();
    // Get the order to retrieve the checkout ID
    const order = await Order.findById(orderId);

    if (!order) {
      // console.log('[YOCO] Order not found:', orderId);
      return { success: false, message: 'Order not found' };
    }

    // console.log('[YOCO] Order found. isPaid:', order.isPaid, 'paymentResult:', order.paymentResult);

    // Check if already paid
    if (order.isPaid) {
      // console.log('[YOCO] Order already paid');
      return { success: true, message: 'Order is already paid' };
    }

    // Get checkout ID from payment result
    const paymentResult = order.paymentResult as { id: string } | null;
    const checkoutId = paymentResult?.id;

    if (!checkoutId) {
      // console.log('[YOCO] No checkout ID found in payment result');
      return { success: false, message: 'No checkout ID found. Please try creating the payment again.' };
    }

    // console.log('[YOCO] Verifying checkout ID:', checkoutId);

    // Verify the payment with Yoco
    const verificationResponse = await verifyYocoPayment(checkoutId);

    // console.log('[YOCO] Verification response:', verificationResponse);

    if (!verificationResponse.success || !verificationResponse.data) {
      return { success: false, message: verificationResponse.message || 'Payment verification failed' };
    }

    const { data } = verificationResponse;

    // console.log('[YOCO] Payment verified successfully. Updating order to paid...');

    // Update order to paid with full audit trail
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: data.id,
        status: data.status,
        email_address: '', // Yoco doesn't return email
        pricePaid: data.amount.toString(),
        currency: 'ZAR',
        verifiedAt: new Date(),
        verificationMethod: 'redirect', // User redirected from Yoco checkout
        rawResponse: JSON.stringify(data), // Store full Yoco response for audit
      },
    });

    // console.log('[YOCO] Order updated to paid successfully');

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been successfully paid via Yoco',
    };
  } catch (err) {
    // console.error('[YOCO] Verify payment error:', err);
    return { success: false, message: formatError(err).message };
  }
}


// Update Order to Paid in Database
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult: PaymentResult;
}): Promise<void> {
    await connectDB();
    // Find the order in the database and include the order items
    const order = await Order.findById(orderId)
      .populate('orderitems')
      .exec();
  
    if (!order) throw new Error('Order not found');
  
    // If order is already paid, just return success (webhook may have already processed it)
    if (order.isPaid) {
      // console.log('[ORDER] Order already marked as paid, skipping update');
      return;
    }
  
    // Set the order to paid (without transaction for local dev)
    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: new Date(),
      paymentResult,
    });
  
    // Get the updated order after the transaction
    const updatedOrder = await Order.findById(orderId)
      .populate('orderitems')
      .populate('userId', 'name email')
      .exec();
  
    if (!updatedOrder) {
      throw new Error('Order not found');
    }

// Send the email to confirm to the client that the order is paid for.
    try {
      // console.log("At this mark -----------------------------------------");
      await sendPurchaseReceipt({ 
        order: {
          ...updatedOrder.toObject(),
          itemsPrice: updatedOrder.itemsPrice.toString(),
          shippingPrice: updatedOrder.shippingPrice.toString(),
          taxPrice: updatedOrder.taxPrice.toString(),
          totalPrice: updatedOrder.totalPrice.toString(),
          totalPriceUsd: updatedOrder.totalPriceUsd?.toString(),
          exchangeRate: updatedOrder.exchangeRate?.toString(),
          orderItems: (updatedOrder.orderitems as any[]).map((oi) => ({
            productId: oi.productId,
            slug: oi.slug,
            image: oi.image,
            name: oi.name,
            price: oi.price.toString(),
            qty: oi.qty,
          })),
          shippingAddress: updatedOrder.shippingAddress as unknown as ShippingAddress,
          paymentResult: updatedOrder.paymentResult as PaymentResult,
        },
      });
      // console.log(`Purchase receipt email sent successfully to ${updatedOrder.user.email}`);
    } catch (emailError) {
      // console.error('Failed to send purchase receipt email:', emailError);
      // Don't throw - we don't want email failures to break the payment process
    }
};



// Get the users orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error('User is not authenticated');

  await connectDB();
  const [data, dataCount] = await Promise.all([
    Order.find({ userId: session.user.id! })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec(),
    Order.countDocuments({ userId: session.user.id! })
  ]);

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
};

// SALES DATA for for the admin/overview page
type SalesDataType = {
  month: string;
  totalSales: number;
}[]



// Get sales data and order summary for the overview page for the admin section
export async function getOrderSummary() {
    await connectDB();
    
    // get the counts for the 4 resources
    const [ordersCount, usersCount, productsCount, productsNeedingReview] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }), // Only count users with 'user' role
      Product.countDocuments(),
      Product.countDocuments({ priceNeedsReview: true }) // Count products needing review
    ]);

    // calc total sales
    const totalSalesResult = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);
    const totalSalesAmount = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

    // get monthly sales in format 10/24
    const salesDataRaw = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: 'MM/yy', date: '$createdAt' } },
          totalSales: { $sum: '$totalPrice' }
        }
      },
      { $project: { month: '$_id', totalSales: 1, _id: 0 } },
      { $sort: { month: 1 } }
    ]);

    const salesData: SalesDataType = salesDataRaw.map((entry: any) => ({
      month: entry.month,
      totalSales: Number(entry.totalSales),
    }));

    // get latest sales
    const latestOrders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name')
      .limit(6)
      .select('id createdAt totalPrice userId')
      .exec();

    return {
      ordersCount,
      productsCount,
      productsNeedingReview,
      usersCount,
      totalSales: totalSalesAmount,
      latestOrders,
      salesData,
    };
};



// Get All Orders (Admin)
export async function getAllOrders({
    limit = PAGE_SIZE,
    page,
    query,
  }: {
    limit?: number;
    page: number;
    query?: string 
  }) {
    await connectDB();
    
    // searching on the query
    const searchFilter = query && query !== 'all' ? { 
      userId: {
        $in: await User.find({ name: { $regex: query, $options: 'i' } }).distinct('_id')
      }
    } : {};

    const [data, dataCount] = await Promise.all([
      Order.find(searchFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('userId', 'name')
        .exec(),
      Order.countDocuments(searchFilter)
    ]);

    return {
      data,
      totalPages: Math.ceil(dataCount / limit),
    };
  };



// Delete an order as an admin
export async function deleteOrder(id: string) {
  try {
    await connectDB();
    // Fetch order with items to restore stock if it was paid
    const order = await Order.findById(id)
      .populate('orderitems')
      .exec();

    if (!order) throw new Error('Order not found');

    // Delete the order (cascade will delete order items)
    await Order.findByIdAndDelete(id);

    revalidatePath('/admin/orders');

    return {
      success: true,
      message: 'Order deleted successfully',
    };

  } catch (error) {
    return { success: false, message: formatError(error).message };
  }
};



// Update Order to Paid in Database
export async function updateOrderToPaidByCOD(orderId: string) {
  try {
    await connectDB();
    // Fetch order to determine total price for paymentResult and preserve existing email
    const order = await Order.findById(orderId)
      .populate('userId', 'email')
      .exec();
    if (!order) throw new Error('Order not found');

    // Mark as paid via Cash on Delivery with a valid PaymentResult payload
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: `cod_${orderId}`,
        status: 'CASH_ON_DELIVERY',
        // Preserve previous payment email if exists; else fall back to user's email or empty string
        email_address: (order.paymentResult as PaymentResult | null)?.email_address ?? (order.userId as any)?.email ?? '',
        pricePaid: order.totalPrice.toString(),
        currency: 'ZAR',
      },
    });
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: 'Order paid successfully' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}

// Update Order To Delivered
export async function deliverOrder(orderId: string) {
  try {
    await connectDB();
    const order = await Order.findById(orderId);

    if (!order) throw new Error('Order not found');
    if (!order.isPaid) throw new Error('Order is not paid');

    await Order.findByIdAndUpdate(orderId, {
      isDelivered: true,
      deliveredAt: new Date(),
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Order delivered successfully' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}