/**
 * High-performance image utilities for native Blob URLs and multipart FormData
 */

// Cache blob URLs for base64 strings to prevent repeated memory allocations
const blobUrlCache = new Map();

/**
 * Converts a base64 string into a real Blob object and returns a blob: URL
 */
export function base64ToBlobUrl(base64String, contentType = "image/jpeg") {
  if (!base64String) return null;

  // Already a blob or http URL
  if (base64String.startsWith("blob:") || base64String.startsWith("http://") || base64String.startsWith("https://")) {
    return base64String;
  }

  // Check cache
  if (blobUrlCache.has(base64String)) {
    return blobUrlCache.get(base64String);
  }

  try {
    let cleanBase64 = base64String;
    let mime = contentType;

    if (base64String.startsWith("data:")) {
      const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        cleanBase64 = match[2];
      } else {
        cleanBase64 = base64String.replace(/^data:[^;]+;base64,/, "");
      }
    }

    const byteCharacters = atob(cleanBase64.trim());
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(base64String, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn("Base64 to Blob conversion note:", err);
    return base64String.startsWith("data:") ? base64String : `data:${contentType};base64,${base64String}`;
  }
}

/**
 * Resolves any product image (File, Blob, base64, URL) into a native Blob or valid image URL
 */
export function getProductImageUrl(img) {
  if (!img) return null;
  if (img instanceof File || img instanceof Blob) {
    return URL.createObjectURL(img);
  }
  if (typeof img === "string") {
    if (img.startsWith("blob:") || img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    return base64ToBlobUrl(img);
  }
  return null;
}
