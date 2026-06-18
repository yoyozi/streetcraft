'use client';

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, 
    TableHead, 
    TableHeader, 
    TableRow,
    TableCell,
    TableBody } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Order } from "@/types";
import Image from "next/image";
import Link from "next/link";
import {
    PayPalButtons,
    PayPalScriptProvider,
    usePayPalScriptReducer,
  } from '@paypal/react-paypal-js';
import { 
    createPayPalOrder, 
    approvePayPalOrder,
    createPaystackOrder,
    verifyPaystackPayment,
    createYocoOrder,
    verifyYocoOrder,
    updateOrderToPaidByCOD,
    deliverOrder,
    setOrderCourierStatus } from "@/lib/actions/order.actions";
import { bookOrderShipment } from "@/lib/actions/courier.actions";
import { toast } from "sonner";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";



    // We have to pass the paypalClientId in the prop as we cannot access .env as its clientside
type EftBankDetails = {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    branchCode: string;
};

const OrderDetailsTable = ({ 
        order, 
        paypalClientId, 
        isAdmin,
        eftBankDetails,
    }: { 
        order: Order, 
        paypalClientId: string, 
        isAdmin: boolean,
        eftBankDetails?: EftBankDetails,
    }) => {

    const router = useRouter();
    const searchParams = useSearchParams();

    // destructure the order
    const { 
        shippingAddress,
        orderItems,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        totalPriceUsd,
        exchangeRate,
        paymentMethod,
        isDelivered,
        isPaid,
        paidAt,
        deliveredAt,
        waybillNumber,
        trackingNumber,
        courierStatus } = order;

    // Track if verification has been attempted to prevent multiple calls
    const [verificationAttempted, setVerificationAttempted] = React.useState(false);

    // Check if returning from payment providers
    React.useEffect(() => {
        // Skip if already attempted verification
        if (verificationAttempted) return;

        const paystackReturn = searchParams.get('trxref') || searchParams.get('reference');
        
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('[ORDER] Search params:', allParams);
        console.log('[ORDER] Search param keys:', Object.keys(allParams));
        console.log('[ORDER] Payment method:', paymentMethod, 'isPaid:', isPaid);
        
        if (paystackReturn && paymentMethod === 'Paystack' && !isPaid) {
            setVerificationAttempted(true);
            toast.loading('Verifying Paystack payment...');
            // Verify payment
            verifyPaystackPayment(order.id).then((res) => {
                toast.dismiss();
                if (res.success) {
                    toast.success(res.message);
                    router.refresh();
                } else {
                    toast.error(res.message || 'Payment verification failed');
                }
            });
        }

        // Yoco verification - trigger if payment method is Yoco and not paid
        // Yoco may not send query parameters, so we verify based on payment method
        if (paymentMethod === 'Yoco' && !isPaid) {
            console.log('[ORDER] Yoco order detected, checking if we should verify...');
            
            // Check if there's a checkoutId in the order's payment result
            const hasCheckoutId = order.paymentResult && 
                                 typeof order.paymentResult === 'object' && 
                                 'id' in order.paymentResult &&
                                 order.paymentResult.id;
            
            console.log('[ORDER] Has checkout ID:', hasCheckoutId);
            
            // Only verify if we have a checkout ID (meaning payment was initiated)
            if (hasCheckoutId) {
                setVerificationAttempted(true);
                toast.loading('Verifying Yoco payment...');
                console.log('[ORDER] Attempting Yoco verification for order:', order.id);
                // Verify Yoco payment
                verifyYocoOrder(order.id).then((res) => {
                    console.log('[ORDER] Yoco verification result:', res);
                    toast.dismiss();
                    if (res.success) {
                        toast.success(res.message);
                        // Force a hard refresh to get updated order data
                        window.location.reload();
                    } else {
                        toast.error(res.message || 'Payment verification failed');
                    }
                }).catch((err) => {
                    console.error('[ORDER] Yoco verification error:', err);
                    toast.dismiss();
                    toast.error('Failed to verify payment');
                });
            }
        }
    }, [searchParams, paymentMethod, isPaid, order.id, router, verificationAttempted, order.paymentResult]);

    const PrintLoadingState = () => {
        const [{ isPending, isRejected  }] = usePayPalScriptReducer();
        let status = '';

        if (isPending) {
            status = 'Loading PayPal...'
        } else if (isRejected) {
            status = 'Error loading PayPal'
            
        }

        return status;
            
    };

    // Creates a PayPal order
    const handleCreatePayPalOrder = async () => {
        const res = await createPayPalOrder(order.id);
        if (!res.success) {
            const msg = typeof res.message === 'string' ? res.message : 'Failed to create PayPal order';
            toast.error(msg);
            throw new Error(msg);
        }
        return res.data;
    };

    // Approves a PayPal order
    const handleApprovePayPalOrder = async (data: { orderID: string }) => {
        const res = await approvePayPalOrder(order.id, data);
        if (!res.success) {
            const msg = typeof res.message === 'string' ? res.message : 'Failed to approve PayPal order';
            toast.error(msg);
            throw new Error(msg);
        }
        toast.success(res.message);
    };

    // Handles Paystack payment
    const handlePaystackPayment = async () => {
        try {
            const res = await createPaystackOrder(order.id);
            console.log('[PAYSTACK] Create order response:', res);
            
            if (!res.success) {
                toast.error(res.message || 'Failed to initialize payment');
                return;
            }
            
            if (!res.authorization_url) {
                toast.error('Payment URL not received');
                return;
            }
            
            // Redirect to Paystack checkout
            window.location.href = res.authorization_url;
        } catch (error) {
            console.error('[PAYSTACK] Payment error:', error);
            toast.error('An unexpected error occurred');
        }
    };


    // Handles Yoco payment
    const handleYocoPayment = async () => {
        const res = await createYocoOrder(order.id);
        if (!res.success) {
            toast.error(res.message);
            return;
        }
        // Redirect to Yoco checkout
        window.location.href = res.redirectUrl;
    };



    // Button To mark the order as paid
    const MarkAsPaidButton = () => {
        const [isPending, startTransition] = useTransition();
        return (
        <Button
            type='button'
            disabled={isPending}
            onClick={() =>
            startTransition(async () => {
                const res = await updateOrderToPaidByCOD(order.id);
                if (res.success) {
                    toast.success(res.message);
                } else {
                    toast.error(res.message);
                }
            })
            }
        >
            {isPending ? 'processing...' : 'Mark As Paid'}
        </Button>
        );
    };
    
    // DEV ONLY — simulate Shiplogic status for sandbox testing
    const SimulateStatusPanel = () => {
        const [status, setStatus] = useState('in-transit');
        const [isPending, startTransition] = useTransition();
        const statuses = [
            { value: 'Submitted',            label: 'Submitted' },
            { value: 'Assigned to courier',  label: 'Assigned to courier' },
            { value: 'Collected from sender', label: 'Collected from sender' },
            { value: 'In transit',           label: 'In transit' },
            { value: 'Out for delivery',     label: 'Out for delivery' },
            { value: 'Delivered',            label: 'Delivered' },
            { value: 'Delivery failed',      label: 'Delivery failed' },
        ];
        return (
            <div className="mt-4 p-3 rounded-md border border-dashed border-yellow-400 bg-yellow-50 space-y-2 text-sm">
                <p className="font-semibold text-yellow-800">⚙ Dev: Simulate courier status</p>
                <div className="flex gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex-1 rounded border px-2 py-1 text-sm"
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                            startTransition(async () => {
                                const res = await setOrderCourierStatus(order.id, status);
                                if (res.success) {
                                    toast.success(res.message);
                                    router.refresh();
                                } else {
                                    toast.error(res.message);
                                }
                            })
                        }
                    >
                        {isPending ? 'Applying...' : 'Apply'}
                    </Button>
                </div>
            </div>
        );
    };

    // Button to request courier collection (admin only — only after items are at collection point)
    const BookCollectionButton = () => {
        const [isPending, startTransition] = useTransition();
        return (
        <Button
            type='button'
            disabled={isPending}
            onClick={() =>
            startTransition(async () => {
                const res = await bookOrderShipment(order.id);
                if (res.success) {
                    toast.success('Courier collection booked — waybill generated');
                    router.refresh();
                } else {
                    toast.error(res.error || 'Failed to book collection');
                }
            })
            }
        >
            {isPending ? 'Booking...' : 'Book Courier Collection'}
        </Button>
        );
    };

    // Button To mark the order as delivered
    const MarkAsDeliveredButton = () => {
        const [isPending, startTransition] = useTransition();
        return (
        <Button
            type='button'
            disabled={isPending}
            onClick={() =>
            startTransition(async () => {
                const res = await deliverOrder(order.id);
                if (res.success) {
                    toast.success(res.message);
                } else {
                    toast.error(res.message);
                }
            })
            }
        >
            {isPending ? 'processing...' : 'Mark As Delivered'}
        </Button>
        );
    };

  return (
    <>
        <h1 className="py-4 text-2xl">Order {formatId(order.id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            <div className="col-span-2 space-y-4 overflow-x-auto">

                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Payment Method</h2>
                        <p className='mb-2'>{paymentMethod}</p>
                        { isPaid ? (
                            <>
                                <Badge variant="secondary">
                                    Paid at {formatDateTime(paidAt!).dateTime}
                                </Badge>
                                {/* Show USD amount and exchange rate for PayPal payments */}
                                {paymentMethod === 'PayPal' && totalPriceUsd && exchangeRate && (
                                    <div className="mt-4 p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium mb-1">PayPal Transaction Details</p>
                                        <p className="text-sm">Amount Charged: <span className="font-semibold">${totalPriceUsd} USD</span></p>
                                        <p className="text-sm">Exchange Rate: <span className="font-semibold">R{exchangeRate} per USD</span></p>
                                        {/* <p className="text-xs text-muted-foreground mt-1">Total in ZAR: {formatCurrency(totalPrice)}</p> */}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Badge variant="destructive">
                                Not Paid
                            </Badge>
                        )}

                    </CardContent>
                </Card>

                <Card className='my-2'>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Shipping Address</h2>
                        <p>{shippingAddress.fullName}</p>
                        <p className="mb-2">
                            {shippingAddress.streetAddress}, {shippingAddress.city}
                            {shippingAddress.postalCode}, {shippingAddress.country}
                        </p>
                        { isDelivered ? (
                            <Badge variant="secondary">
                                Delivered at {formatDateTime(deliveredAt!).dateTime}
                            </Badge>
                        ) : courierStatus ? (
                            <Badge variant="outline" className="border-blue-400 text-blue-700">
                                {courierStatus}
                            </Badge>
                        ) : waybillNumber ? (
                            <Badge variant="outline" className="border-blue-400 text-blue-700">
                                Collection booked
                            </Badge>
                        ) : isPaid ? (
                            <Badge variant="outline" className="text-muted-foreground">
                                Preparing for collection
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                Awaiting payment
                            </Badge>
                        )}
                        {(waybillNumber || trackingNumber) && (
                            <div className="mt-3 p-3 bg-muted rounded-md space-y-1 text-sm">
                                <p className="font-medium">Courier Booking</p>
                                {courierStatus && (
                                    <p>Status: <span className="font-semibold">{courierStatus}</span></p>
                                )}
                                {waybillNumber && (
                                    <p>Waybill: <span className="font-semibold">{waybillNumber}</span></p>
                                )}
                                {trackingNumber && (
                                    <p>Tracking: <span className="font-semibold">{trackingNumber}</span></p>
                                )}
                            </div>
                        )}

                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">
                            Order Items
                        </h2>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderItems.map ((item) => (
                                        <TableRow key={item.slug}>
                                            <TableCell>
                                                <Link className="flex items-center gap-4" href={`/product/${item.slug}`}>
                                                    <Image src={item.image} alt={item.name} width={50} height={50} />
                                                    <span className="px-2">{item.name}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2">{item.qty}</span>
                                            </TableCell>
                                            <TableCell>
                                                R<span className="text-right">{item.price}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardContent className="p-4 gap-4 space-y-4">
                        
                        <div className="flex justify-between">
                                <div>Items</div>
                                <div>{ formatCurrency(itemsPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                                <div>Tax</div>
                                <div>{ formatCurrency(taxPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                                <div>Shipping</div>
                                <div>{ formatCurrency(shippingPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                                <div>Total</div>
                                <div>{ formatCurrency(totalPrice)}</div>
                        </div>


                        
                        {/* EFT Payment Instructions */}
                        { !isPaid && paymentMethod === 'EFT' && (
                            <div className="border border-blue-500 rounded-lg p-4 bg-blue-50">
                                <h3 className="font-semibold text-blue-900 mb-3">EFT Payment Instructions</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Bank:</span>
                                        <span className="font-semibold">{eftBankDetails?.bankName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Account Holder:</span>
                                        <span className="font-semibold">{eftBankDetails?.accountHolder}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Account Number:</span>
                                        <span className="font-bold text-base">{eftBankDetails?.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Branch Code:</span>
                                        <span className="font-semibold">{eftBankDetails?.branchCode}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                                        <span className="text-gray-700 font-medium">Reference:</span>
                                        <span className="font-bold text-red-600">{order.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded text-xs">
                                    <p className="font-semibold text-orange-900">⚠️ Important:</p>
                                    <p className="text-orange-800">Use the reference number above when making payment. Payment instructions have been sent to your email.</p>
                                </div>
                            </div>
                        )}

                        {/* Paypal payment */}
                        { !isPaid && paymentMethod === 'PayPal' && (
                            <div>
                                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                                    <PrintLoadingState />
                                    <PayPalButtons createOrder={handleCreatePayPalOrder} onApprove={handleApprovePayPalOrder} />
                                </PayPalScriptProvider>
                            </div>
                        )}

                        {/* Paystack payment */}
                        { !isPaid && paymentMethod === 'Paystack' && (
                            <div>
                                <Button 
                                    onClick={handlePaystackPayment}
                                    variant="outline"
                                    className="w-full bg-transparent hover:bg-gray-100 border-2 border-gray-300 text-gray-700 hover:text-gray-700 font-semibold transition-all py-6"
                                    size="lg"
                                >
                                    <span className="flex items-center gap-3">
                                        Pay with
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src="/images/paystack.svg" 
                                            alt="Paystack" 
                                            className="h-10 w-auto"
                                        />
                                    </span>
                                </Button>
                                <p className="text-sm text-muted-foreground mt-2 text-center">
                                    You will be redirected to Paystack to complete your payment
                                </p>
                            </div>
                        )}

                        {/* Yoco payment */}
                        { !isPaid && paymentMethod === 'Yoco' && (
                            <div>
                                <Button 
                                    onClick={handleYocoPayment}
                                    variant="outline"
                                    className="w-full bg-transparent hover:bg-gray-100 border-2 border-gray-300 text-gray-700 hover:text-gray-700 font-semibold transition-all py-6"
                                    size="lg"
                                >
                                    <span className="flex items-center gap-3">
                                        Pay with
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src="/images/yoco.svg" 
                                            alt="Yoco" 
                                            className="h-10 w-auto"
                                        />
                                    </span>
                                </Button>
                                <p className="text-sm text-muted-foreground mt-2 text-center">
                                    Secure payment powered by Yoco • You will be redirected to complete your payment
                                </p>
                            </div>
                        )}

                        { /* Cash On Delivery */ }
                        { isAdmin && !isPaid && (<MarkAsPaidButton />) }
                        { isAdmin && isPaid && !waybillNumber && <BookCollectionButton /> }
                        { isAdmin && isPaid && !isDelivered && <MarkAsDeliveredButton /> }
                        { isAdmin && process.env.NODE_ENV === 'development' && <SimulateStatusPanel /> }
                    </CardContent>
                </Card>
            </div>
        </div>
    </>
  );
};

export default OrderDetailsTable;