import { getBackendOrigin } from "@/shared/api/base-url";
import { getBackendApiBaseUrl } from "@/shared/api/base-url";

const BACKEND_ORIGIN = getBackendOrigin();
const BACKEND_API_BASE_URL = getBackendApiBaseUrl();

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

function normalizeForCompare(value: string): string {
  return value.trim().normalize("NFD");
}

function toDecodedFileStem(urlOrPath: string): string {
  const pathPart = urlOrPath.split("?")[0];
  const fileName = pathPart.split("/").pop() ?? "";
  const decoded = decodeURIComponent(fileName);
  const extIdx = decoded.lastIndexOf(".");
  if (extIdx <= 0) {
    return normalizeForCompare(decoded);
  }
  return normalizeForCompare(decoded.slice(0, extIdx));
}

export async function getCatalogColorPreviewMap(
  dir: string,
  colorTags: string[],
): Promise<Record<string, string>> {
  const response = await fetch(
    `${BACKEND_API_BASE_URL}/content/catalog/slides/${encodeURIComponent(dir)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Failed to load slides for ${dir}`);
  }

  const slides = (await response.json()) as string[];
  const byStem = new Map<string, string>();
  for (const slideURL of slides) {
    byStem.set(toDecodedFileStem(slideURL), slideURL);
  }

  const result: Record<string, string> = {};
  for (const colorTag of colorTags) {
    const stem = normalizeForCompare(colorTag);
    const matched = byStem.get(stem);
    if (matched) {
      result[colorTag] = matched;
      continue;
    }

    // fallback to previous backend resolver endpoint
    result[colorTag] = getCatalogColorPreviewUrl(dir, colorTag);
  }

  return result;
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
