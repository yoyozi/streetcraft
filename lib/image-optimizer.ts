/**
 * Client-side image optimization for uploads.
 *
 * Runs entirely in the browser before files are sent to UploadThing so that
 * stored/served images are resized and re-encoded to a web-friendly size.
 *
 * Fail-safe: if anything goes wrong (unsupported format, decode error, etc.)
 * the original file is returned unchanged so uploads never break.
 */

export interface OptimizeImageOptions {
  /** Maximum output width in pixels. Image is scaled down to fit, never up. */
  maxWidth?: number;
  /** Maximum output height in pixels. Image is scaled down to fit, never up. */
  maxHeight?: number;
  /** Output encoding quality between 0 and 1 (lossy formats only). */
  quality?: number;
  /** Output MIME type. WebP gives the best web compression. */
  mimeType?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  mimeType: 'image/webp',
};

// Formats we should not touch (vector / animated / non-decodable).
const SKIP_TYPES = new Set(['image/svg+xml', 'image/gif']);

function scaleToFit(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to HTMLImageElement loader.
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function renameExtension(name: string, mimeType: string): string {
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base}.${ext}`;
}

/**
 * Optimize a single image file. Returns a new File, or the original file if
 * optimization is not applicable or would not reduce the size.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const source = await loadBitmap(file);
    const sourceWidth = 'width' in source ? source.width : 0;
    const sourceHeight = 'height' in source ? source.height : 0;
    if (!sourceWidth || !sourceHeight) {
      return file;
    }

    const { width, height } = scaleToFit(
      sourceWidth,
      sourceHeight,
      opts.maxWidth,
      opts.maxHeight
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(source, 0, 0, width, height);
    if ('close' in source && typeof source.close === 'function') {
      source.close();
    }

    const blob = await canvasToBlob(canvas, opts.mimeType, opts.quality);
    if (!blob || blob.size >= file.size) {
      // No saving (e.g. already smaller); keep original to avoid quality loss.
      return file;
    }

    return new File([blob], renameExtension(file.name, opts.mimeType), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('[image-optimizer] Falling back to original file:', error);
    return file;
  }
}

/**
 * Optimize a list of image files in parallel. Drop-in helper for UploadThing's
 * `onBeforeUploadBegin` callback.
 */
export async function optimizeImages(
  files: File[],
  options?: OptimizeImageOptions
): Promise<File[]> {
  return Promise.all(files.map((file) => optimizeImage(file, options)));
}
