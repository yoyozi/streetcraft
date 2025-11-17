// To test the loading spinner
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// const HomePage = async () => {
//   await delay(2000)
//   return <>Latest Products</>;
// };

import { getLatestProducts, getFeaturedProducts } from "@/lib/actions/product.actions";
import ProductList from "@/components/shared/product/product-list";
import { ProductCarousel } from "@/components/shared/product/product-carousel";
import ViewAllProductsButton from "@/components/view-all-products-button";
import IconBoxes from "@/components/icon-boxes";
import DealCountdown from "@/components/deal-countdown";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HomePage = async () => {

    const latestProducts = await getLatestProducts();
    const featuredProducts = await getFeaturedProducts();

    return <>

        {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts} />}

        <ProductList 
            data={latestProducts} 
            title="New Arrivals"
            limit={4}
        />
        <ViewAllProductsButton />
        <DealCountdown />
        <IconBoxes />
    </> 
};

export default HomePage
