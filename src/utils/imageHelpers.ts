import config from '../config';

// Derive the storage base URL from the API base URL
// e.g.  http://localhost:8000/api  →  http://localhost:8000/storage
const storageBase = config.api.baseURL.replace(/\/api\/?$/, '/storage');

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
 * Product images are stored as full URLs or relative paths.
 */
export function resolveProductImage(src?: string): string {
  if (!src) return '/placeholder-image.svg';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return `${storageBase}${src}`;
  return `${storageBase}/products/${src}`;
}
