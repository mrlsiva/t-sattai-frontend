import config from '../config';

// Derive the storage base URL from the API base URL as a fallback.
// In dev, REACT_APP_STORAGE_URL should point to the XAMPP public storage path
// e.g. http://localhost/vembarkarupatti/t-sattai-backend/public/storage
const storageBase: string =
  process.env.REACT_APP_STORAGE_URL ||
  config.api.baseURL.replace(/\/api\/?$/, '/storage');

/**
 * Resolve a category image to a displayable URL.
 *
 * The backend returns two fields:
 *   image         – filename only   e.g. "1234567890_abc.webp"
 *   display_image – full URL        e.g. "http://localhost/storage/categories/1234567890_abc.webp"
 *
 * display_image may use a different host/port than the actual dev server, so we
 * prefer to rebuild the URL from the known API base when the hostname doesn't match.
 */
export function resolveCategoryImage(
  image?: string,
  displayImage?: string
): string | null {
  // Prefer display_image if it already uses the correct origin
  if (displayImage) {
    try {
      const url = new URL(displayImage);
      const apiUrl = new URL(config.api.baseURL);
      if (url.origin === apiUrl.origin) {
        return displayImage;
      }
      // display_image has wrong origin (e.g. no port) — rebuild from the filename
      const filename = url.pathname.split('/').pop();
      if (filename) return `${storageBase}/categories/${filename}`;
    } catch {
      // display_image is not a valid URL — fall through
    }
  }

  if (image) {
    // Already a full URL
    if (image.startsWith('http')) return image;
    // Just a filename or relative path
    const filename = image.split('/').pop();
    return `${storageBase}/categories/${filename}`;
  }

  return null;
}

/**
 * Resolve a product image to a displayable URL.
 *
 * Handles three URL patterns the backend emits:
 *   1. http://127.0.0.1:8000/localhost/storage/products/file  – artisan serve + leaked hostname in path
 *   2. http://localhost/vembarkarupatti/.../public/storage/products/file – XAMPP full sub-path
 *   3. https://backend.vembarkarupatti.in/storage/products/file – production, leave as-is
 *
 * For cases 1 & 2, the file path after /storage/ is extracted and rebuilt against storageBase.
 */
export function resolveProductImage(src?: string): string {
  if (!src) return '/placeholder-image.svg';
  if (src.startsWith('http')) {
    try {
      const url = new URL(src);
      const pathname = url.hostname !== 'localhost' && url.pathname.startsWith('/localhost/')
        ? url.pathname.slice('/localhost'.length)  // Case 1: strip the spurious /localhost prefix
        : url.pathname;                             // Case 2 & 3: use pathname as-is

      const storageIdx = pathname.indexOf('/storage/');
      if (storageIdx >= 0) {
        // Rebuild from the known accessible storage base
        return `${storageBase}${pathname.slice(storageIdx + '/storage'.length)}`;
      }
    } catch {
      // not a valid URL
    }
    return src;
  }
  if (src.startsWith('/')) return `${storageBase}${src}`;
  return `${storageBase}/products/${src}`;
}
