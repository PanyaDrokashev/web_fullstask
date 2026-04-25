import { getBackendOrigin } from "@/shared/api/base-url";

const BACKEND_ORIGIN = getBackendOrigin();

function startsWithHttp(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function getCatalogAssetUrl(path: string): string {
  if (!path) {
    return "";
  }

  if (startsWithHttp(path)) {
    return path;
  }

  if (path.startsWith("/bruska/assets/")) {
    return `${BACKEND_ORIGIN}${path}`;
  }

  if (path.startsWith("/catalog/")) {
    return `${BACKEND_ORIGIN}/bruska/assets${path}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${normalizedPath}`;
}

export function getCatalogDirAssetUrl(dir: string, fileName: string): string {
  const encodedDir = encodeURIComponent(dir);
  const encodedFileName = encodeURIComponent(fileName);

  return `${BACKEND_ORIGIN}/bruska/assets/catalog/${encodedDir}/${encodedFileName}`;
}

export function getCatalogColorPreviewUrl(dir: string, colorTag: string): string {
  const encodedDir = encodeURIComponent(dir);
  const encodedColor = encodeURIComponent(`${colorTag.normalize("NFD")}.jpg`);
  return `${BACKEND_ORIGIN}/bruska/content/catalog/color-image/${encodedDir}/${encodedColor}`;
}

export function getCatalogCardImageUrl(
  dir: string,
  img: string,
  _firstColorTag?: string,
): string {
  const encodedDir = encodeURIComponent(dir);
  const previewFromBackend = `${BACKEND_ORIGIN}/bruska/content/catalog/preview/${encodedDir}`;

  if (img) {
    if (/^\/catalog\/[^/]+\.[a-zA-Z0-9]+$/.test(img)) {
      return previewFromBackend;
    }
    return getCatalogAssetUrl(img);
  }

  return previewFromBackend;
}
