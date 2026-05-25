'use server';

import { CartItem } from "@/types"
import { cookies } from "next/headers"
import { formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { cartItemSchema } from "@/lib/validations/cart";
import { round2 } from "../utils";
import { revalidatePath } from "next/cache";

import type { ActionResponse } from "@/types"

export type CartActionResponse = ActionResponse

// calculate the cart prices
const calcPrice = (items: CartItem[]) => {
    const itemsPrice = round2(
        items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 1000 ? 0 : 150),
    taxPrice = 0,
    totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    return {
        itemsPrice: itemsPrice,
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalPrice: totalPrice
    }
}

// we need to get the cookie data from the header so we get the cartId given
export async function addItemToCart(data: CartItem): Promise<CartActionResponse> {
    try {
        // check for the cart cookie, if none throw error
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        if (!sessionCartId) throw new Error('Cart session not found')

        // get the session and the user ID - via the auth function
        const session = await auth();  
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get the cart using the function created below
        const cart = await getMyCart();

        // Parse method used validate the data put into this function
        let item;
        try {
            item = cartItemSchema.parse(data);
        } catch (validationError) {
            return formatError(validationError);
        }

        // Find the item to be added to the cart in the database
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error('Product not found');

        // if there was no Cart we want to create one 
        if (!cart) {
            const prices = calcPrice([item]);

            await prisma.cart.create({
                data: {
                    userId: userId || null,
                    sessionCartId: sessionCartId,
                    itemsPrice: prices.itemsPrice,
                    shippingPrice: prices.shippingPrice,
                    taxPrice: prices.taxPrice,
                    totalPrice: prices.totalPrice,
                    items: {
                        create: {
                            productId: item.productId,
                            name: item.name,
                            slug: item.slug,
                            qty: item.qty,
                            image: item.image,
                            price: Number(item.price),
                        }
                    }
                }
            });

            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} added to Cart`
            };
        } else {
            // check if item already in the cart
            const existItem = await prisma.cartItem.findFirst({
                where: { cartId: cart.id, productId: item.productId }
            });

            if (existItem) {
                // increase the qty
                await prisma.cartItem.update({
                    where: { id: existItem.id },
                    data: { qty: existItem.qty + 1 }
                });
            } else {
                // add new item to cart
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.productId,
                        name: item.name,
                        slug: item.slug,
                        qty: item.qty,
                        image: item.image,
                        price: Number(item.price),
                    }
                });
            }

            // Recalculate prices
            const allItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
            const cartItems: CartItem[] = allItems.map(i => ({
                productId: i.productId,
                name: i.name,
                slug: i.slug,
                qty: i.qty,
                image: i.image,
                price: i.price.toFixed(2),
            }));
            const prices = calcPrice(cartItems);

            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    itemsPrice: prices.itemsPrice,
                    shippingPrice: prices.shippingPrice,
                    taxPrice: prices.taxPrice,
                    totalPrice: prices.totalPrice,
                }
            });

            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`
            }
        }

    } catch (error) {
        return formatError(error)
    }
};

// get the cart of the user 
export async function getMyCart() {
        // check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        if (!sessionCartId) throw new Error('Cart session not found')

        // get the session and the user ID
        const session = await auth();  
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get the users cart from the DB
        const cart = await prisma.cart.findFirst({
            where: userId ? { userId } : { sessionCartId },
            include: { items: true },
        });

        // if there is no cart return undefined
        if (!cart) return undefined;

        // return cart with string prices for compatibility
        return {
            ...cart,
            items: cart.items.map(i => ({
                productId: i.productId,
                name: i.name,
                slug: i.slug,
                qty: i.qty,
                image: i.image,
                price: i.price.toFixed(2),
            })),
            itemsPrice: cart.itemsPrice.toFixed(2),
            totalPrice: cart.totalPrice.toFixed(2),
            shippingPrice: cart.shippingPrice.toFixed(2),
            taxPrice: cart.taxPrice.toFixed(2),
        };
}

export async function removeItemFromCart(productId: string): Promise<CartActionResponse> {
    try {
        // check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        if (!sessionCartId) throw new Error('Cart session not found');

        // Get the product
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('Product not found');

        // get the users cart if none throw error
        const cart = await getMyCart();
        if (!cart) throw new Error('Cart not found');

        // check for item in cart
        const existItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId }
        });
        if (!existItem) throw new Error('Item not found');

        if (existItem.qty === 1) {
            // remove the item entirely
            await prisma.cartItem.delete({ where: { id: existItem.id } });
        } else {
            // decrease qty
            await prisma.cartItem.update({
                where: { id: existItem.id },
                data: { qty: existItem.qty - 1 }
            });
        }

        // Recalculate prices
        const allItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        const cartItems: CartItem[] = allItems.map(i => ({
            productId: i.productId,
            name: i.name,
            slug: i.slug,
            qty: i.qty,
            image: i.image,
            price: i.price.toFixed(2),
        }));
        const prices = calcPrice(cartItems);

        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                itemsPrice: prices.itemsPrice,
                shippingPrice: prices.shippingPrice,
                taxPrice: prices.taxPrice,
                totalPrice: prices.totalPrice,
            }
        });

        revalidatePath(`/product/${product.slug}`);

        return {
            success: true,
            message: `${product.name} was removed from cart`
        }

    } catch (error) {
        return formatError(error)  
    }
}