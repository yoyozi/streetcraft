'use client';

import { toast } from "sonner";
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { Minus, Plus, Loader, ArrowRight } from 'lucide-react';
import { Cart } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from '@/components/ui/card';


const CartTable = ({ cart }: { cart?: Cart }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    
  return (
    <>
        <h1 className="py-4 h2-bold">Shopping Cart</h1>
        { !cart || cart.items.length === 0 ? (
            <div> 
                Your cart is empty. <Link href="/">Go Shopping</Link>
            </div>
        ) : (
            <div className="grid md:grid-cols-4 md:gap-5">
                <div className="overflow-x-auto md:col-span-3">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.items.map((item) => (
                              <TableRow key={item.productId}>
                                <TableCell>
                                    <Link href={`/product/${item.slug}`} className='flex items-center'>
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} width={50} height={50} />
                                        ) : (
                                            <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center text-xs">
                                                No image
                                            </div>
                                        )}
                                        <span className='px-2'>{item.name}</span>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button disabled={isPending} variant="outline" type='button' 
                                            onClick={() => startTransition(async() => {
                                                const res = await removeItemFromCart(item.productId);
                                                
                                                if (res.success) {
                                                    toast.success(res.message);
                                                    router.refresh();
                                                } else {
                                                    toast.error(res.message);
                                                }
                                            
                                            })}>
                                                { isPending ? (
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Minus className="h-4 w-4" />
                                                ) }
                                        </Button>
                                        <span className="min-w-8 text-center">{ item.qty }</span>
                                        <Button disabled={isPending} variant="outline" type='button' 
                                            onClick={() => startTransition(async() => {
                                                // Ensure price is a string
                                                const itemToAdd = {
                                                    ...item,
                                                    price: typeof item.price === 'number' ? item.price.toString() : item.price
                                                };
                                                const res = await addItemToCart(itemToAdd);
                                                
                                                if (res.success) {
                                                    toast.success(res.message);
                                                } else {
                                                    toast.error(res.message);
                                                }
                                                router.refresh();
                                            })}>
                                                { isPending ? (
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                ) }
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(Number(item.price) * item.qty)}
                                </TableCell>
                              </TableRow>   
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Card>
                    <CardContent className="p-4 gap-4">
                            <div className="pb-3 text-xl">
                                Subtotal ({ cart.items.reduce((a, c) => a + c.qty, 0)}): {' '}
                                <span className="font-bold">{formatCurrency(cart.itemsPrice)}</span>
                            </div>
                    </CardContent>
                    <div className="flex justify-center pb-4">
                        <Button className="w-3/4" disabled={isPending} onClick={ () => 
                            startTransition(() => router.push('/shipping-address'))}> 
                                {isPending ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                Checkout
                        </Button>
                    </div>
                </Card>
            </div>
        )}
    </>
  );
};

export default CartTable;