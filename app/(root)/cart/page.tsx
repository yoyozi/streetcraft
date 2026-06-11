import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Shopping Cart',
};

const CartPage = async () => {
  const cart = await getMyCart();

  // Get unique product IDs for items in cart
  const uniqueProductIds: string[] = [];
  if (cart && cart.items.length > 0) {
    const productIds = cart.items.map(i => i.productId);
    const uniqueProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isUnique: true },
      select: { id: true },
    });
    uniqueProductIds.push(...uniqueProducts.map(p => p.id));
  }

  return (
    <>
      <CartTable cart={cart} uniqueProductIds={uniqueProductIds} />
    </>
  );
};

export default CartPage;
