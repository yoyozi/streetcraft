'use server';

import { CartItem } from "@/types"
import { cookies } from "next/headers"
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { connectDB, Product, Cart } from '../mongodb/models';
import { cartItemSchema, insertCartSchema } from "../validators";
import { round2 } from "../utils";
import { revalidatePath } from "next/cache";

import type { ActionResponse } from "@/types"

export type CartActionResponse = ActionResponse

// calculate the cart prices
const calcPrice = (items: CartItem[]) => {
    // itemsPrice is the total of all items without shipping etc
    const itemsPrice = round2(
        // use reduce to add the prices together
        items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 1000 ? 0 : 150),
    //taxPrice = round2(0.15 * itemsPrice),
    taxPrice = 0,
    totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    return {
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2)
    }
}

// we need to get the cookie data from the header so we get the cartId given
export async function addItemToCart(data: CartItem): Promise<CartActionResponse> {
    try {
        console.log('=== addItemToCart START ===');
        console.log('Input data:', data);

        // check for the cart cookie, if none throw error
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        console.log('Session cart ID:', sessionCartId);
        if (!sessionCartId) throw new Error(('Cart session not found'))

        // get the session and the user ID - via the auth function
        const session = await auth();  
        console.log('Auth session:', session);
        // if we are NOT logged in then the user will be undefined  
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get the cart using the function created below
        const cart = await getMyCart();
        console.log('Existing cart:', cart);

        // Parse method used validate the data put into this function
        console.log('Raw item data:', data);
        let item;
        try {
            item = cartItemSchema.parse(data);
            console.log('Validated item:', item);
        } catch (validationError) {
            console.error('Validation error details:', validationError);
            const errorResponse = formatError(validationError);
            console.log('Formatted error response:', errorResponse);
            return errorResponse;
        }

        // Find the item to be added to the cart in the database
        await connectDB();
        const product = await Product.findById(item.productId);
        if (!product) throw new Error('Product not found');

        // if there was no Cart we want to create one 
        if (!cart) {
            // create a new cart object
            const newCart = insertCartSchema.parse({
                userId: userId,
                items: [item],
                sessionCartId: sessionCartId,
                ...calcPrice([item])
            })

            // add to DB
            await Cart.create(newCart);

            // revalidate the product page
            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} added to Cart`
            };

            //console.log(newCart)
        } else {
            // if there is a cart then we need to check if the product is in cart if it is add to qty or add item
            // check if item already in the cart
            const existItem = (cart.items as CartItem[]).find((x) => x.productId === item.productId);

            if (existItem) {
                // increase the qty on the cart
                // get the items qty
                (cart.items as CartItem[]).find((x) => x.productId === item.productId)!.qty = existItem.qty + 1;
            } else {
                // if the item does not exist in the cart
                // Add item to the cart.items array 
                cart.items.push(item);

            }

            // Save to the database by updating the cart model AND we also need to update the prices as they will change
            await Cart.findByIdAndUpdate(cart.id, {
                items: cart.items,
                // Work out the new prices
                ...calcPrice(cart.items as CartItem[])
            });

            // revalidate the product page
            revalidatePath(`/product/${product.slug}`)

            // then we return results of this addition
            return {
            success: true,
            message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`
            }
        }

                // TESTING
        // console.log({
        //     'SessionCartId': sessionCartId,
        //     'UserId': userId,
        //     'Item Requested': item,
        //     'Product found': product
        // });

    } catch (error) {
        console.log('=== CATCH BLOCK ===');
        console.log('Error caught:', error);
        const errorResponse = formatError(error);
        console.log('Formatted error response:', errorResponse);
        console.log('=== addItemToCart END ===');
        return errorResponse // properly scoped catch
    }
};

// get the cart of the user 
export async function getMyCart() {
        // check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        // if no sessionCartId throw an error
        if (!sessionCartId) throw new Error(('Cart session not found'))

        // get the session and the user ID - via the auth function
        const session = await auth();  
        // if we are NOT logged in then the user will be undefined  
        const userId = session?.user?.id ? (session.user.id as string) : undefined

        // get the users cart from the DB
        await connectDB();
        const cart = await Cart.findOne(
            userId ? { userId: userId } : { sessionCartId: sessionCartId }
        );

        // if there is no cart return undefined
        if (!cart) return undefined;

        // if is a cart convert the decimals and return it
        return convertToPlainObject({
            ...cart.toObject(),
            items: cart.items as CartItem[],
            itemsPrice: cart.itemsPrice.toString(),
            totalPrice: cart.totalPrice.toString(),
            shippingPrice: cart.shippingPrice.toString(),
            taxPrice: cart.taxPrice.toString(),
        })

}

export async function removeItemFromCart(productId: string): Promise<CartActionResponse> {
    try {

        // check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
        // if no sessionCartId throw an error
        if (!sessionCartId) throw new Error(('Cart session not found'));

        // Get the product
        await connectDB();
        const product = await Product.findById(productId);

        if (!product) throw new Error('Product not found');

        // get the users cart if none throw error
        const cart = await getMyCart();
        if (!cart) throw new Error('Cart not found');

        // check for item in cart
        const exist = (cart.items as CartItem[]).find((x) => x.productId === productId);
        if (!exist) throw new Error('Item not found');

        // if qty is 1 then we need to remove it differant than if more than one
        if (exist.qty === 1) {
            // we use filter that returns all except the one we stipulate
            cart.items = (cart.items as CartItem[]).filter((x) => x.productId !== exist.productId);

        } else {
            // if its greater than 1 decrease the qty
            (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty = exist.qty - 1;
        }

        // update in the databse    
        await Cart.findByIdAndUpdate(cart.id, {
            items: cart.items,
            // Work out the new prices
            ...calcPrice(cart.items as CartItem[])
        });

        // revalidate the path
        revalidatePath(`/product/${product.slug}`);

        return {
            success: true,
            message: `${product.name} was removed from cart`
        }

    } catch (error) {
        return formatError(error)  
    }
}