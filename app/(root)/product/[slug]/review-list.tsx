"use client";

import { Review } from '@/types';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewForm from './review-form';
import { getReviews } from '@/lib/actions/review.action';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, Calendar } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Rating from '@/components/shared/product/rating';

const ReviewList = ({ userId, productId, productSlug }: 
    { userId: string, 
        productId: string, 
        productSlug: string 
    }) => {

    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        const loadReviews = async () => {
            const res = await getReviews({ productId });
            setReviews(res.data || []);
        };

        loadReviews();
    }, [productId]);

    const reload = async () => {
        const fetchedReviews = await getReviews({ productId });
        setReviews(fetchedReviews.data || []);
    }

    return (
        <div className="space-y-4">
            { userId ? (  
                    <ReviewForm userId={userId} productId={productId} onReviewSubmitted={reload}/>
                ) : ( 
                    <div>Please 
                        <Link 
                            href={`/sign-in?callbackUrl=/product/${productSlug}`}
                            className='text-blue-700 px-2'
                        >
                            sign in
                        </Link> 
                            to review this product
                    </div> 
                )
            }
            <div className="flex flex-col gap-3">
                {reviews.length === 0 ? (
                    <div>No reviews yet</div>
                ) : (
                    <div className='flex flex-col gap-3'>

                        {reviews.map((review) => (
                            <Card key={review.id}>
                                <CardHeader>
                                    <div className="flex-between">
                                        <CardTitle>
                                            {review.title}
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        {review.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-4 text-sm text-muted-foreground">
                                        <Rating value={review.rating}/>
                                        <div className="flex items-center">
                                            <UserIcon className='mr-1 h-3 w-3' />
                                            {review.user ? review.user.name : 'User'}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className='mr-1 h-3 w-3' />
                                        {formatDateTime(review.createdAt).dateTime }
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewList;