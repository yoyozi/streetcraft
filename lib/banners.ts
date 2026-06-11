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
export function getBanners(): string[] {
  try {
    return fs
      .readdirSync(BANNER_DIR)
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => `/banners/${file}`);
  } catch {
    return [];
  }
}
