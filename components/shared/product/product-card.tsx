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
    
    // Function to refresh cart data
    const refreshCart = async () => {
        try {
            const cartData = await getMyCart();
            setCart(cartData);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    };
    
    // Fetch cart data on component mount
    useEffect(() => {
        refreshCart();
    }, []);
    
    // Debug: Log product data to see what we're working with
    console.log('Product data:', product);
    console.log('Product _id:', product._id);
    console.log('Product id:', product.id);
    console.log('Product keys:', Object.keys(product));
    console.log('Product _id type:', typeof product._id);
    
    // Try multiple possible ID fields with better debugging
    let productId = product.id || product._id; // Try id first since that's where the actual ID is
    console.log('Initial productId:', productId);
    
    // If still undefined, try to find any field that looks like an ID
    if (!productId || productId === 'undefined') {
        const possibleIdFields = Object.keys(product).filter(key => 
            key.toLowerCase().includes('id') && product[key as keyof typeof product] && product[key as keyof typeof product] !== 'undefined'
        );
        console.log('Possible ID fields:', possibleIdFields);
        
        if (possibleIdFields.length > 0) {
            productId = product[possibleIdFields[0] as keyof typeof product] as string;
            console.log('Using fallback ID field:', possibleIdFields[0], productId);
        }
    }
    
    if (!productId || productId === 'undefined') {
        console.error('No valid product ID found:', product);
        return (
            <Card className="w-full max-w-sm">
                <CardContent className="p-4">
                    <p className="text-red-500">Error: Product ID missing</p>
                    <p className="text-xs text-gray-500">Available keys: {Object.keys(product).join(', ')}</p>
                </CardContent>
            </Card>
        );
    }
    
    // Convert Product to CartItem format
    const cartItem: CartItem = {
        productId: productId,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder-product.png',
        qty: 1
    };
    
    // Debug: Log cartItem to verify all fields
    console.log('Cart item:', cartItem);

    return ( <Card className="w-full max-w-sm !pt-0 overflow-hidden">
        <CardHeader className="p-0 items-center">
            <Link href={`/product/${product.slug}`}>
                {product.images && product.images[0] ? (
                    <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        height={300} 
                        width={300} 
                        priority={true} 
                        className="object-cover h-64 w-full" />
                ) : (
                    <div className="h-64 w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                    </div>
                )}
            </Link>
        </CardHeader>
        <CardContent className="p-4 grid gap-4">
            <Link href={`/product/${product.slug}`}>
                <h2 className="text-sm font-medium">{product.name}: {product.description}</h2>
            </Link>
            <AddToCart cart={cart} item={cartItem} onCartUpdate={refreshCart} />
            <div className="flex-between gap-4">
                <Rating value={Number(product.rating)} />
                <ProductPrice value={Number(product.price)} />
            </div>
        </CardContent>
    </Card> );
}

export default ProductCard;