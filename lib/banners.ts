import fs from 'fs';
import path from 'path';

const BANNER_DIR = path.join(process.cwd(), 'public', 'banners');
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
]);

/**
 * Lists banner images stored in `public/banners`.
 *
 * Banners are managed manually (committed to the repo) — there is no upload UI.
 * Returns public URL paths (e.g. `/banners/banner-1.jpg`) sorted by filename in
 * natural/numeric order. Returns an empty array if the folder is missing.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getBanners(): string[] {
  try {
    const files = fs
      .readdirSync(BANNER_DIR)
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .map((file) => `/banners/${file}`);
    return shuffle(files);
  } catch {
    return [];
  }
}
