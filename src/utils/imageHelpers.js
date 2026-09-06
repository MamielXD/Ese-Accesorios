// utils/imageHelpers.js
export const getImageUrl = (baseUrl, size = 'medium') => {
  if (!baseUrl) return '';
  // The original URL from the DB is expected to be the 'original' size, e.g., 'producto-123.webp'
  // For other sizes, we append the suffix before the extension.
  if (size === 'original') {
    return baseUrl; // No suffix for the original size
  }
  if (!['small', 'medium', 'large'].includes(size)) {
    size = 'medium'; // Default to medium if an invalid size is provided
  }
  
  // Ensure the base URL ends with .webp before replacing
  if (baseUrl.endsWith('.webp')) {
    return baseUrl.replace('.webp', `-${size}.webp`);
  }
  // If it doesn't end with .webp, we might have a problem or it's a different format.
  // For now, return the base URL as is, or handle error.
  console.warn(`getImageUrl: Base URL '${baseUrl}' does not end with '.webp'. Cannot apply size suffix.`);
  return baseUrl;
};
