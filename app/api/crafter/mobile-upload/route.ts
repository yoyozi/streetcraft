import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'craft') {
      return NextResponse.json({ success: false, error: 'Only crafters can upload images' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    console.log('[Mobile Upload] File received:', file.name, file.size, file.type);

    // File size validation (16MB limit)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File size exceeds 16MB limit' }, { status: 400 });
    }

    console.log('[Mobile Upload] Attempting UploadThing upload...');

    // Upload using UploadThing server SDK - pass File object directly
    const uploadResponse = await utapi.uploadFiles([file]);

    console.log('[Mobile Upload] UploadThing response:', JSON.stringify(uploadResponse, null, 2));

    if (!uploadResponse || uploadResponse.length === 0) {
      console.error('[Mobile Upload] UploadThing returned empty response');
      return NextResponse.json({ success: false, error: 'Upload failed - no response from server' }, { status: 500 });
    }

    const firstResponse = uploadResponse[0];
    
    if (firstResponse.error) {
      console.error('[Mobile Upload] UploadThing error:', firstResponse.error);
      return NextResponse.json({ success: false, error: firstResponse.error.message || 'Upload failed' }, { status: 500 });
    }

    const imageUrl = firstResponse.ufsUrl;
    
    if (!imageUrl) {
      console.error('[Mobile Upload] No URL in upload response, full response:', JSON.stringify(firstResponse, null, 2));
      return NextResponse.json({ success: false, error: 'Upload failed - no URL returned from UploadThing' }, { status: 500 });
    }
    
    console.log('[Mobile Upload] Image URL:', imageUrl);

    // Submit the image to the database using relative URL
    const response = await fetch('/api/crafter/image-uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await response.json();
    console.log('[Mobile Upload] Database response:', result);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Image uploaded successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to save image' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Mobile Upload] Error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed: ' + (error as Error).message }, { status: 500 });
  }
}