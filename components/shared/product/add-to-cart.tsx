'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Plus, Minus, Loader2 } from "lucide-react"
import { CartItem, Cart } from "@/types"
import { toast } from "sonner"
import { addItemToCart, removeItemFromCart, CartActionResponse } from "@/lib/actions/cart.actions"
import { useState, useTransition } from "react"

interface AddToCartProps {
    cart?: Cart
    item: CartItem
    isUnique?: boolean
    isSold?: boolean
    onCartUpdate?: () => void
}

    const AddToCart = ({ cart, item, isUnique, isSold, onCartUpdate }: AddToCartProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    // Local flag to immediately lock unique items after first add
    const [uniqueAdded, setUniqueAdded] = useState(false)

    const handleAddToCart = () => {
        startTransition(async () => {
        try {
            const res: CartActionResponse = await addItemToCart(item)

            if (res && res.success) {
            // Immediately lock the button for unique items
            if (isUnique) setUniqueAdded(true)

            if (onCartUpdate) {
                await onCartUpdate();
            }
            
            toast.success(res.message, {
                description: "Click to view your cart",
                action: { label: "Go to cart", onClick: () => router.push("/cart") },
            })
            } else {
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
            if (isUnique) setUniqueAdded(false)

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
    const inCart = existItem || uniqueAdded

    if (isSold) {
        return (
            <Button variant="destructive" type="button" disabled className="w-full">
                Sold
            </Button>
        )
    }

    if (inCart && isUnique) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" type="button" disabled className="flex-1">
                    In Cart
                </Button>
                <Button variant="outline" type="button" onClick={handleRemoveFromCart} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                </Button>
            </div>
        )
    }

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
