// To test the loading spinner
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// const HomePage = async () => {
//   await delay(2000)
//   return <>Latest Products</>;
// };

import { getLatestProducts } from "@/lib/actions/product.actions";
import { getDealSettings } from "@/lib/actions/settings.actions";
import { getBanners } from "@/lib/banners";
import ProductList from "@/components/shared/product/product-list";
import { BannerCarousel } from "@/components/shared/banner-carousel";
import ViewAllProductsButton from "@/components/view-all-products-button";
import IconBoxes from "@/components/icon-boxes";
import DealCountdown from "@/components/deal-countdown";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HomePage = async () => {

    const [latestProducts, dealSettings] = await Promise.all([
        getLatestProducts(),
        getDealSettings(),
    ]);

    const banners = getBanners();

    return <>

        <p className="text-center text-muted-foreground text-lg py-3">
          Local{' '}
          <a href="/crafters" className="underline underline-offset-4 hover:text-foreground transition-colors">
            streetcrafters
          </a>
          {' '}Internet sales
        </p>

        <BannerCarousel banners={banners} />

        <ProductList 
            data={latestProducts} 
            title="New Arrivals"
            limit={4}
        />
        <ViewAllProductsButton />
        <DealCountdown 
            isActive={dealSettings.isActive}
            targetDate={dealSettings.targetDate}
            title={dealSettings.title}
            description={dealSettings.description}
            image={dealSettings.image}
        />
        <IconBoxes />
    </> 
};

export default HomePage
