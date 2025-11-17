import { notFound } from "next/navigation";
import ProductPrice from "@/components/shared/product/product-price";
import { Card, CardContent } from "@/components/ui/card";
import { getProductBySlug } from "@/lib/actions/product.actions";
import { Badge } from "@/components/ui/badge";
import ProductImages from '@/components/shared/product/product-images';
import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.actions";
import ReviewList from "./review-list";
import { auth } from "@/auth";
import Rating from '@/components/shared/product/rating';

const ProductDetailsPage = async (props: { params: Promise<{ slug: string }> }) => {
    const { slug } = await props.params;
    const product = await getProductBySlug(slug);
    if (!product) notFound();

    const cart = await getMyCart();
    const session = await auth();
    const userId = session?.user?.id;

    return (
        <>
            <section>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Images column */}
                    <div className="md:col-span-2">
                        <ProductImages images={product.images} />
                    </div>
                    {/* Details column */}
                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-gray-500">
                                {product.brand} / {product.category}
                            </p>
                            <h1 className="text-2xl font-bold">{product.name}</h1>
                            <div className="flex items-center gap-2">
                                <Rating value={Number(product.rating)} />
                                <span className="text-sm text-gray-600">
                                    ({product.numReviews} reviews)
                                </span>
                            </div>
                            <div className="mt-2">
                                <ProductPrice
                                    key={product.id} 
                                    value={Number(product.price)}
                                    className="text-2xl font-bold text-gray-800"
                                />
                            </div>
                            <div className="mt-4">
                                <h3 className="font-semibold">Description</h3>
                                <p className="mt-2 text-gray-700">{product.description || 'No description available.'}</p>
                            </div>
                        </div>
                    </div>
                    {/* Actions column */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardContent className="p-4">
                                <div className="mb-4 flex justify-between items-center">
                                    <span>Price</span>
                                    <ProductPrice key={`${product.id}-action`} value={Number(product.price)} />
                                </div>
                                <div className="mb-4 flex justify-between items-center">
                                    <span>Availability</span>
                                    {product.availability === 0 ? (
                                        <Badge variant='outline'>In Stock</Badge>
                                    ) : (
                                        <Badge variant='destructive'>{product.availability} days</Badge>
                                    )}
                                </div>
                                {product.stock > 0 && (
                                    <AddToCart 
                                        cart={cart}
                                        item={{
                                            productId: product.id,
                                            name: product.name,
                                            slug: product.slug,
                                            price: product.price.toString(),
                                            qty: 1,
                                            image: product.images?.[0] || '/images/placeholder.png'
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            <section className="mt-10">
                <h2 className="text-xl font-bold">Customer Reviews</h2>
                <ReviewList
                    userId={userId || ''}
                    productId={product.id}
                    productSlug={product.slug}
                />
            </section>
        </>
    );
}

export default ProductDetailsPage;