'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Plus, Minus, Loader2 } from "lucide-react"
import { CartItem, Cart } from "@/types"
import { toast } from "sonner"
import { addItemToCart, removeItemFromCart, CartActionResponse } from "@/lib/actions/cart.actions"
import { useTransition } from "react"

interface AddToCartProps {
    cart?: Cart
    item: CartItem
    onCartUpdate?: () => void
}

    const AddToCart = ({ cart, item, onCartUpdate }: AddToCartProps) => {
    const router = useRouter()
    
    // useTransition for pending state
    const [isPending, startTransition] = useTransition()

    const handleAddToCart = () => {
        console.log('=== handleAddToCart START ===');
        console.log('Item being passed:', item);
        
        startTransition(async () => {
        try {
            // Debug: Log the item being sent
            console.log('Sending item to cart:', item);
            console.log('About to call addItemToCart...');
            
            const res: CartActionResponse = await addItemToCart(item)
            
            console.log('Received response from addItemToCart:', res);
            console.log('Response type:', typeof res);
            console.log('Response keys:', Object.keys(res));

            if (res && res.success) {
            // Refresh cart data to update UI
            if (onCartUpdate) {
                await onCartUpdate();
            }
            
            toast.success(res.message, {
                description: "Click to view your cart",
                action: { label: "Go to cart", onClick: () => router.push("/cart") },
            })
            } else {
            console.error('Cart action failed:', res);
            toast.error(res?.message || 'Unknown error occurred')
            }
        } catch (err) {
            console.error("Add to cart error:", err)
            toast.error("Something went wrong while adding to cart.")
        }
        })
    }

    const handleRemoveFromCart = () => {
        startTransition(async () => {
        try {
            const res: CartActionResponse = await removeItemFromCart(item.productId)

            if (res && res.success) {
            // Refresh cart data to update UI
            if (onCartUpdate) {
                await onCartUpdate();
            }
            
            toast.success(res.message)
            } else {
            toast.error(res?.message || 'Failed to remove item from cart')
            }
        } catch (err) {
            console.error("Remove from cart error:", err)
            toast.error("Something went wrong while removing from cart.")
        }
        })
    }

    const existItem = cart?.items.find(x => x.productId === item.productId)

    return existItem ? (
        <div className="flex items-center justify-center gap-2">
        <Button variant="outline" type="button" onClick={handleAddToCart} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>

        <span className="px-2">{existItem.qty}</span>

        <Button variant="outline" type="button" onClick={handleRemoveFromCart} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
        </Button>
        </div>
    ) : (
        <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={handleAddToCart}
        disabled={isPending}
        >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus />}
        </Button>
    )
}

export default AddToCart
