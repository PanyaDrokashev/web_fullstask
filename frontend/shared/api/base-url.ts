function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getBackendOrigin(): string {
  const isServer = typeof window === "undefined";
  const raw = isServer
    ? process.env.BACKEND_API_URL ??
      process.env.NEXT_PUBLIC_BACKEND_API_URL ??
      "http://localhost:8080/bruska"
    : process.env.NEXT_PUBLIC_BACKEND_API_URL ??
      process.env.BACKEND_API_URL ??
      "http://localhost:8080/bruska";

  const normalized = trimTrailingSlash(raw);
  if (normalized.endsWith("/bruska")) {
    return normalized.slice(0, -"/bruska".length);
  }

  return normalized;
}

export function getBackendApiBaseUrl(): string {
  return `${getBackendOrigin()}/bruska`;
}
