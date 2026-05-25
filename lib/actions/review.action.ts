'use server'

import { insertReviewSchema } from "@/lib/validations/review";
import { formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types";
import { z } from "zod";

// Get reviews for a product
export async function getReviews({productId}: {productId: string}) {
    try {
        const data = await prisma.review.findMany({
            where: { productId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, message: formatError(error) || 'Failed to get review' }
    }
}



// Get a review for a product written by the current user
export const getReviewByProductId = async ({
    productId,
  }: {
    productId: string;
  }) => {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');
    
    return await prisma.review.findFirst({
      where: { productId, userId: session.user.id! },
    });
  };



// Create & Update Review
export async function createUpdateReview(
    data: z.infer<typeof insertReviewSchema>
  ): Promise<ActionResponse> {
    try {
      const session = await auth();
      if (!session) throw new Error('User is not authenticated');
  
      // Validate and store review data and userId
      const review = insertReviewSchema.parse({
        ...data,
        userId: session?.user.id,
      });
  
      // Get the product being reviewed
      const product = await prisma.product.findUnique({
        where: { id: review.productId },
      });
  
      if (!product) throw new Error('Product not found');
  
      // Check if user has already reviewed this product
      const reviewExists = await prisma.review.findFirst({
        where: { productId: review.productId, userId: review.userId },
      });
  
      // Use Prisma transaction for atomic operations
      await prisma.$transaction(async (tx) => {
        if (reviewExists) {
          // Update the review
          await tx.review.update({
            where: { id: reviewExists.id },
            data: {
              description: review.description,
              title: review.title,
              rating: review.rating,
            },
          });
        } else {
          // Create a new review
          await tx.review.create({ data: review });
        }
  
        // Get the average rating
        const avgResult = await tx.review.aggregate({
          where: { productId: review.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });
  
        const averageRating = avgResult._avg.rating || 0;
        const numReviews = avgResult._count.rating || 0;
  
        // Update rating and number of reviews
        await tx.product.update({
          where: { id: review.productId },
          data: {
            rating: averageRating,
            numReviews: numReviews,
          },
        });
      });
  
      revalidatePath(`/product/${product.slug}`);
  
      return {
        success: true,
        message: 'Review updated successfully',
      };
    } catch (error) {
      const errorResponse = formatError(error);
      return {
        success: false,
        message: errorResponse.message,
      };
    }
}