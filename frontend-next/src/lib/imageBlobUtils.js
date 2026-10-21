/**
 * High-performance image utilities for native Blob URLs and multipart FormData
 */

// Cache blob URLs for base64 strings to prevent repeated memory allocations
const blobUrlCache = new Map();

/**
 * Auto-detect image MIME type from base64 signature or data URI
 */
function detectMimeType(base64Str, defaultMime = "image/jpeg") {
  if (!base64Str) return defaultMime;
  const clean = base64Str.replace(/^data:[^;]+;base64,/, "").trim();
  if (clean.startsWith("/9j/") || clean.startsWith("/9j")) return "image/jpeg";
  if (clean.startsWith("iVBORw0KGgo")) return "image/png";
  if (clean.startsWith("UklGR")) return "image/webp";
  if (clean.startsWith("R0lGOD")) return "image/gif";
  if (clean.startsWith("AAAAHGZ0eXBhdmlm") || clean.includes("ftypavif") || clean.includes("Z0eXBhdmlm")) return "image/avif";
  return defaultMime;
}

/**
 * Converts a base64 string into a real Blob object and returns a blob: URL
 */
export function base64ToBlobUrl(base64String, contentType) {
  if (!base64String) return null;

  // Already a blob or http URL
  if (
    base64String.startsWith("blob:") ||
    base64String.startsWith("http://") ||
    base64String.startsWith("https://")
  ) {
    return base64String;
  }

  // Check cache
  if (blobUrlCache.has(base64String)) {
    return blobUrlCache.get(base64String);
  }

  try {
    let cleanBase64 = base64String.trim();
    let mime = contentType;

    if (cleanBase64.startsWith("data:")) {
      const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        cleanBase64 = match[2].trim();
      } else {
        cleanBase64 = cleanBase64.replace(/^data:[^;]+;base64,/, "").trim();
      }
    } else {
      mime = detectMimeType(cleanBase64, contentType || "image/jpeg");
    }

    // SSR fallback if running on server without window/DOM APIs
    if (typeof window === "undefined" || !window.atob || !window.Blob || !window.URL?.createObjectURL) {
      return `data:${mime};base64,${cleanBase64}`;
    }

    const byteCharacters = atob(cleanBase64);
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
    console.warn("Base64 to Blob conversion fallback:", err);
    const mime = detectMimeType(base64String, contentType || "image/jpeg");
    const clean = base64String.replace(/^data:[^;]+;base64,/, "").trim();
    return `data:${mime};base64,${clean}`;
  }
}

/**
 * Resolves any product image (File, Blob, base64, URL) into a native Blob or valid image URL
 */
export function getProductImageUrl(img) {
  if (!img) return null;
  if (img instanceof File || img instanceof Blob) {
    if (typeof window !== "undefined" && window.URL?.createObjectURL) {
      return URL.createObjectURL(img);
    }
    return null;
  }
  if (typeof img === "string") {
    const trimmed = img.trim();
    if (!trimmed) return null;

    // Already a blob or http(s) URL
    if (trimmed.startsWith("blob:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    // Explicit data URI
    if (trimmed.startsWith("data:image/")) {
      return base64ToBlobUrl(trimmed);
    }

    // Distinguish a real static file path (e.g. /images/aspirin.png, uploads/item.jpg)
    // from base64 data. File paths are short (< 500 chars) and end with an image extension.
    const isFilePath =
      trimmed.length < 500 &&
      (/\.(png|jpe?g|webp|gif|svg|avif|ico|bmp)$/i.test(trimmed) ||
        trimmed.startsWith("/images/") ||
        trimmed.startsWith("/static/") ||
        trimmed.startsWith("/uploads/") ||
        trimmed.startsWith("images/") ||
        trimmed.startsWith("uploads/"));

    if (isFilePath) {
      if (trimmed.startsWith("/")) return trimmed;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
      return `${apiBase}/${trimmed.replace(/\\/g, "/").replace(/^\/+/, "")}`;
    }

    // Otherwise, it's base64 image data (including JPEGs whose base64 starts with '/9j/')
    return base64ToBlobUrl(trimmed);
  }
  return null;
}
