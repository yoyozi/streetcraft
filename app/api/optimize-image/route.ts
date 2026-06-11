import { NextResponse } from 'next/server';
import { optimizeImage } from '@/lib/image-optimizer';
import { UTApi } from 'uploadthing/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, entityType, entityId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    const originalFile = new File([blob], 'image.jpg', { type: blob.type });

    // Optimize the image
    const optimizedFile = await optimizeImage(originalFile, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.82,
      mimeType: 'image/webp',
    });

    // Check if optimization actually reduced size
    if (optimizedFile.size >= originalFile.size) {
      console.log('Image optimization did not reduce size, keeping original');
      return NextResponse.json({ 
        success: true,
        message: 'Image already optimized'
      });
    }

    // Delete original from UploadThing
    const utapi = new UTApi();
    try {
      await utapi.deleteFiles([imageUrl]);
      console.log('Deleted original image from UploadThing');
    } catch (error) {
      console.error('Failed to delete original image:', error);
      // Continue with upload even if deletion fails
    }

    // Upload optimized version
    const uploadResponse = await utapi.uploadFiles([optimizedFile]);
    
    if (!uploadResponse || uploadResponse.length === 0) {
      throw new Error('Failed to upload optimized image');
    }

    // Handle different possible response structures from UploadThing
    const uploadResult = uploadResponse[0];
    const newImageUrl = (uploadResult as any)?.data?.url || (uploadResult as any)?.ufsUrl || (uploadResult as any)?.url;

    if (!newImageUrl) {
      throw new Error('Upload succeeded but no URL returned');
    }

    console.log('Image optimization complete:', {
      original: originalFile.size,
      optimized: optimizedFile.size,
      savings: `${((1 - optimizedFile.size / originalFile.size) * 100).toFixed(1)}%`,
      oldUrl: imageUrl,
      newUrl: newImageUrl
    });

    // Update database references based on entity type
    if (entityType === 'productImageUpload' && entityId) {
      // This would require updating the ProductImageUpload table
      // For now, we'll return the new URL so the caller can update it
      return NextResponse.json({ 
        success: true,
        newUrl: newImageUrl,
        oldUrl: imageUrl,
        savings: `${((1 - optimizedFile.size / originalFile.size) * 100).toFixed(1)}%`
      });
    }

    return NextResponse.json({ 
      success: true,
      newUrl: newImageUrl,
      oldUrl: imageUrl,
      savings: `${((1 - optimizedFile.size / originalFile.size) * 100).toFixed(1)}%`
    });

  } catch (error) {
    console.error('Background optimization failed:', error);
    return NextResponse.json(
      { error: 'Optimization failed' },
      { status: 500 }
    );
  }
}