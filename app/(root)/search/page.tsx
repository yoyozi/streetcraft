import Pagination from '@/components/shared/pagination';
import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import { getAllProducts, getAllCategories } from '@/lib/actions/product.actions';
import Link from 'next/link';
import MobileFilters from './mobile-filters';

const prices = [
    {
        name: 'R1 - R50',
        value: '1-50'
    },
    {
        name: 'R50 - R100',
        value: '50-100'
    },
    {
        name: 'R100 - R500',
        value: '100-500'
    },
    {
        name: 'R500 - R1000',
        value: '500-1000'
    },
    {
        name: 'R1000 - R50000',
        value: '1000-50000'
    },
]

const ratings = [ 4, 3, 2, 1 ];

const sortOrders = ['newest', 'lowest', 'highest', 'rating'];

// Set Metadata / title to be search params based
export async function generateMetadata(props: {
    searchParams: Promise<{
      q: string;
      category: string;
      price: string;
      rating: string
    }>
}) {
    const { 
        q = 'all',
        category = 'all', 
        price = 'all', 
        rating = 'all' 
    } = await props.searchParams;

    // isXSet will be true if it is set and not 'all' or empty
    const isQuerySet = q && q !== 'all' && q.trim() !== '';
    const isCategorySet = category && category !== 'all' && category.trim() !== '';
    const isPriceSet = price && price !== 'all' && price.trim() !== '';
    const isRatingSet = rating && rating !== 'all' && rating.trim() !== '';
    
    // So if any of them are set
    if (isQuerySet || isCategorySet || isPriceSet || isRatingSet) {
        return {
            title: `Search ${isQuerySet ? q : ''}` + 
            (isCategorySet ? `Category: ${category}` : '') +
            (isPriceSet ? `Price: ${price}` : '') +
            (isRatingSet ? `Rating: ${rating}` : '')
        }
    } else {
        return {
            title: 'Search Products',
        }
    }
}

const SearchPage = async (props: {
    searchParams: Promise<{
      q?: string;
      category?: string;
      price?: string;
      rating?: string;
      sort?: string;
      page?: string;
    }>;
  }) => {
    const {
      q = 'all',
      category = 'all',
      price = 'all',
      rating = 'all',
      sort = 'newest',
      page = '1',
    } = await props.searchParams;
  
    //console.log(q, category, price, rating, sort, page);

    // Now for the filters - get the filters added and tag them onto the existing fields
    // c - category, s - sort, p - price, r - rating, pg - page
    const getFilterUrl = ({
        c,
        s,
        p,
        r,
        pg,
    }: { 
        c?: string,
        s?: string,
        p?: string,
        r?: string,
        pg?: string,
    }) => {

        // Now we get what was set and merge the two into one
        const params = { q, category, price, rating, page, sort };
        if(c) params.category = c;
        if(p) params.price = p;
        if(r) params.rating = r;
        if(pg) params.page = pg;
        if(s) params.sort = s;

        return `/search?${new URLSearchParams(params).toString()}`;

    };

    // getAllProducts returns an object of data and totalPages
    const products = await getAllProducts({
        query: q,
        category,
        price,
        rating,
        page: Number(page),
        sort,
    });

    console.log('Products found:', products?.data?.length, 'Total pages:', products?.totalPages);

    // Get all categories for the filters on the left
    const categories = await getAllCategories()

    return (
    <div className='md:flex md:gap-5'>
        {/* Mobile Filters - Dropdowns */}
        <MobileFilters
            category={category}
            price={price}
            rating={rating}
            categories={categories}
            prices={prices}
            //ratings={ratings}
        />

        {/* Desktop Filters - Sidebar */}
        <div className='filter-links hidden md:block md:w-48 md:flex-shrink-0'>
            {/* FILTERS ON THE LEFT - Desktop only */}

            {/* FILTER - CATEGORY */}
            <div className="text-xl mb-2 mt-3">Category</div>
            <div>
                <ul className='space-y-1'>
                    <li>
                        <Link 
                            className={`${(category === 'all' || category === '') && 'font-bold'}`} 
                            href={getFilterUrl({c: 'all'})}>
                            All
                        </Link>
                    </li>
                    {categories.map((x) => (
                        <li key={x.category}>
                            <Link 
                                className={`${category === x.category ? 'font-bold' : ''}`} 
                                href={getFilterUrl({c: x.category})}>
                                {x.category}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* FILTER - PRICE */}
            <div className="text-xl mb-2 mt-8">Price</div>
            <div>
                <ul className='space-y-1'>
                    <li>
                        <Link 
                            className={`${(price === 'all' || price === '') && 'font-bold'}`} 
                            href={getFilterUrl({p: 'all'})}>
                            All
                        </Link>
                    </li>
                    {prices.map((v) => (
                        <li key={v.name}>
                            <Link 
                                className={`${price === v.value ? 'font-bold' : ''}`} 
                                href={getFilterUrl({p: v.value})}>
                                {v.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* FILTER - RATING */}
            <div className="text-xl mb-2 mt-8">Customer Ratings</div>
            <div>
                <ul className='space-y-1'>
                    <li>
                        <Link 
                            className={`${(rating === 'all' || rating === '') && 'font-bold'}`} 
                            href={getFilterUrl({r: 'all'})}>
                            All
                        </Link>
                    </li>
                    {ratings.map((rat) => (
                        <li key={rat}>
                            <Link 
                                className={`${rating === rat.toString() ? 'font-bold' : ''}`} 
                                href={getFilterUrl({r: rat.toString()})}>
                                {`${rat}+ Stars and up`}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        <div className='md:flex-1 space-y-4'>

        <div className="flex-between flex-col my-4 md:flex-row">
            <div className="hidden md:flex items-center">
                <span className="font-semibold mr-2">{products?.data?.length || 0} products found</span>
                { q !== 'all' && q !== '' && ' | Query: ' + q}
                { category !== 'all' && category !== '' && ' | Category: ' + category}
                { price !== 'all' && ' | Price: ' + price}
                { rating !== 'all' && ' | Rating: ' + rating + ' stars and up'}
                &nbsp;
                { 
                    (q !== 'all' && q !== '') ||
                    (category !== 'all' && category !== '') ||
                    (price !== 'all') ||
                    (rating !== 'all') ? (
                        <Button variant={'link'} asChild>
                            <Link href='/search'>Clear</Link>
                        </Button>
                    ) : null

                }
            </div>

            {/* SORTING */}
            <div className="hidden md:block">
                Sort by{' '}
                { sortOrders.map((order) => (
                    <Link 
                        key={order}
                        href={getFilterUrl({s: order})}
                        className={`mx-2 ${sort === order ? 'font-bold' : ''}`}>
                        {" " + order}
                    </Link>
                ))}
            </div>

        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 justify-items-center'>
            {products?.data?.length === 0 ? (
                <div>No products found</div>
            ) : (
                products?.data?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))
            )}
        </div>
        {products?.totalPages && products.totalPages > 1 && (
            <Pagination page={page} totalPages={products.totalPages} />
        )}
        </div>
    </div>
    );
};
  
export default SearchPage;