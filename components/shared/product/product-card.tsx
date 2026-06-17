'use client'

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ProductPrice from "./product-price";
import { Product, CartItem, Cart } from "@/types";
import Rating from "./rating";
import AddToCart from "./add-to-cart";
import { useEffect, useState } from "react";
import { getMyCart } from "@/lib/actions/cart.actions";

const ProductCard = ({ product }: { product: Product }) => {
    const [cart, setCart] = useState<Cart | undefined>();
    
    const refreshCart = async () => {
        try {
            const cartData = await getMyCart();
            setCart(cartData);
        } catch {
            // silently ignore
        }
    };
    
    useEffect(() => {
        refreshCart();
    }, []);
    
    const productId = product.id || product._id;
    
    if (!productId || productId === 'undefined') {
        return null;
    }
    
    const cartItem: CartItem = {
        productId: productId,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder-product.png',
        qty: 1
    };

    const isSold = product.isUnique && product.availability <= 0;

    return (
        <Card className="w-full max-w-sm !pt-0 overflow-hidden">
            <CardHeader className="p-0 items-center">
                <Link href={`/product/${product.slug}`} className="relative block w-full">
                    {product.images && product.images[0] ? (
                        <Image 
                            src={product.images[0]} 
                            alt={product.name} 
                            height={300} 
                            width={300} 
                            priority={true} 
                            unoptimized
                            className="object-cover h-64 w-full" />
                    ) : (
                        <div className="h-64 w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                        </div>
                    )}
                    {product.isUnique && (
                        <div className="absolute top-0 left-0 w-full">
                            <div className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold tracking-wide uppercase text-white ${isSold ? 'bg-red-600' : 'bg-amber-500'}`}>
                                <span>✦</span>
                                <span>{isSold ? 'Sold — One of a Kind' : 'One of a Kind'}</span>
                                <span>✦</span>
                            </div>
                        </div>
                    )}
                </Link>
            </CardHeader>
            <CardContent className="p-4 grid gap-4">
                <Link href={`/product/${product.slug}`}>
                    <h2 className="text-sm font-medium">{product.name}: {product.description}</h2>
                </Link>
                <AddToCart cart={cart} item={cartItem} isUnique={product.isUnique} isSold={isSold} onCartUpdate={refreshCart} />
                <div className="flex-between gap-4">
                    <Rating value={Number(product.rating)} />
                    <ProductPrice value={Number(product.price)} />
                </div>
            </CardContent>
        </Card>
    );
}

export default ProductCard;