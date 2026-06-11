'use client';

import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export function ProductCarousel({ data }: { data: Product[] }) {
  // Log the data prop to see what's being passed to the component
  //console.log('ProductCarousel data:', JSON.stringify(data, null, 2));
  
  return (
    <Carousel
      className='w-full mb-12'
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 2000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {data.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className='relative mx-auto w-full aspect-[1920/680] overflow-hidden rounded-sm'>
                <Image
                  alt={product.name}
                  src={product.banner || product.images?.[0] || '/images/banner-1.jpg'}
                  fill
                  sizes='100vw'
                  className='object-cover'
                  unoptimized
                />
                <div className='absolute inset-0 flex items-end justify-center'>
                  <h2 className=' bg-gray-900 bg-opacity-50 text-2xl font-bold px-2 text-white  '>
                    {product.name}
                  </h2>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}