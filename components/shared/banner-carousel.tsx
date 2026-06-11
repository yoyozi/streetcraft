'use client';

import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';

export function BannerCarousel({ banners }: { banners: string[] }) {
  if (!banners || banners.length === 0) return null;

  return (
    <Carousel
      className='w-full mb-12'
      opts={{ loop: true }}
      plugins={[
        Autoplay({
          delay: 4000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {banners.map((src, index) => (
          <CarouselItem key={src}>
            <div className='relative mx-auto w-full aspect-[3/1] overflow-hidden rounded-sm'>
              <Image
                alt={`Banner ${index + 1}`}
                src={src}
                fill
                priority={index === 0}
                sizes='100vw'
                className='object-cover'
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}
