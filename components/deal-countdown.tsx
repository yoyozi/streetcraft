'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface DealCountdownProps {
  isActive: boolean;
  targetDate: string;
  title: string;
  description: string;
  image: string;
}

const calculateTimeRemaining = (targetDate: Date) => {
  const currentTime = new Date();
  const timeDifference = Math.max(Number(targetDate) - Number(currentTime), 0);
  return {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  };
};

const DealCountdown = ({ isActive, targetDate, title, description, image }: DealCountdownProps) => {
  const [time, setTime] = useState<ReturnType<typeof calculateTimeRemaining>>();

  const parsedDate = targetDate ? new Date(targetDate) : null;

  useEffect(() => {
    if (!parsedDate || !isActive) return;

    setTime(calculateTimeRemaining(parsedDate));

    const timerInterval = setInterval(() => {
      const newTime = calculateTimeRemaining(parsedDate);
      setTime(newTime);

      if (
        newTime.days === 0 &&
        newTime.hours === 0 &&
        newTime.minutes === 0 &&
        newTime.seconds === 0
      ) {
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, isActive]);

  // Don't render if deal is disabled
  if (!isActive || !parsedDate) return null;

  // Render a loading state during hydration
  if (!time) {
    return null;
  }

  // If the countdown is over, don't show the deal
  if (
    time.days === 0 &&
    time.hours === 0 &&
    time.minutes === 0 &&
    time.seconds === 0
  ) {
    return null;
  }

  return (
    <section className='grid grid-cols-1 md:grid-cols-2 my-20'>
      <div className='flex flex-col gap-2 justify-center items-center'>
        <h3 className='text-3xl font-bold'>{title}</h3>
        <p>{description}</p>
        <ul className='grid grid-cols-4'>
          <StatBox label='Days' value={time.days} />
          <StatBox label='Hours' value={time.hours} />
          <StatBox label='Minutes' value={time.minutes} />
          <StatBox label='Seconds' value={time.seconds} />
        </ul>
        <div className='text-center'>
          <Button asChild>
            <Link href='/search'>View Products</Link>
          </Button>
        </div>
      </div>
      {image && (
        <div className='flex justify-center'>
          <Image
            src={image}
            alt='promotion'
            width={300}
            height={200}
            className='w-auto h-auto'
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      )}
    </section>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <li className='p-4 w-full text-center'>
    <p className='text-3xl font-bold'>{value}</p>
    <p>{label}</p>
  </li>
);

export default DealCountdown;