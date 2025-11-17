'use server'

import { insertReviewSchema } from "../validators";
import { formatError } from "../utils";
import { auth } from "@/auth";
import { connectDB, Review, Product } from '../mongodb/models';
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types";
import { z } from "zod";

// Get reviews for a product
export async function getReviews({productId}: {productId: string}) {
    try {
        await connectDB();
        const data = await Review.find({ productId })
            .populate('userId', 'name email')
            .sort({ createdAt: 'desc' })
            .exec();
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
    
    await connectDB();
    return await Review.findOne({ productId, userId: session?.user.id });
  };



// Create & Update Review
export async function createUpdateReview(
    data: z.infer<typeof insertReviewSchema>
  ): Promise<ActionResponse> {
    try {
      const session = await auth();
      if (!session) throw new Error('User is not authenticated');
  
      await connectDB();
      // Validate and store review data and userId
      const review = insertReviewSchema.parse({
        ...data,
        userId: session?.user.id,
      });
  
      // Get the product being reviewed
      const product = await Product.findById(review.productId);
  
      if (!product) throw new Error('Product not found');
  
      // Check if user has already reviewed this product
      const reviewExists = await Review.findOne({
        productId: review.productId,
        userId: review.userId,
      });
  
      // Use MongoDB session for transaction-like behavior
      const sessionMongo = await Review.startSession();
      sessionMongo.startTransaction();
  
      try {
        if (reviewExists) {
          // Update the review
          await Review.findByIdAndUpdate(reviewExists.id, {
            description: review.description,
            title: review.title,
            rating: review.rating,
          }, { session: sessionMongo });
        } else {
          // Create a new review
          await Review.create([review], { session: sessionMongo });
        }
  
        // Get the average rating
        const avgResult = await Review.aggregate([
          { $match: { productId: review.productId } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ], { session: sessionMongo });
  
        const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;
  
        // Get the number of reviews
        const numReviews = await Review.countDocuments(
          { productId: review.productId },
          { session: sessionMongo }
        );
  
        // Update rating and number of reviews
        await Product.findByIdAndUpdate(review.productId, {
          rating: averageRating || 0,
          numReviews: numReviews,
        }, { session: sessionMongo });
  
        await sessionMongo.commitTransaction();
      } catch (error) {
        await sessionMongo.abortTransaction();
        throw error;
      } finally {
        sessionMongo.endSession();
      }
  
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