import { cache } from "react";

import {
  IArticle,
  ICatalogItem,
  IHomeData,
  ILayoutData,
  IProductPageData,
} from "@/shared/types/content";
import { getBackendApiBaseUrl } from "@/shared/api/base-url";

const API_BASE_URL = getBackendApiBaseUrl();

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${path} (${response.status})`);
  }

  return response.json();
}

export const getLayoutData = cache(
  async (authorized: boolean, userName?: string) => {
    const query = new URLSearchParams();
    if (authorized) {
      query.set("authorized", "true");
    }
    if (userName) {
      query.set("user", userName);
    }

    const qs = query.toString();

    return apiFetch<ILayoutData>(`/content/layout${qs ? `?${qs}` : ""}`);
  },
);

export const getHomeData = cache(async () => {
  return apiFetch<IHomeData>("/content/home");
});

export const getProductPageData = cache(async () => {
  return apiFetch<IProductPageData>("/content/product-page");
});

export const getCatalogItems = cache(async () => {
  return apiFetch<ICatalogItem[]>("/content/catalog");
});

export const getCatalogItemById = cache(async (id: string) => {
  return apiFetch<ICatalogItem>(`/content/catalog/${id}`);
});

export const getArticles = cache(async () => {
  return apiFetch<IArticle[]>("/content/articles");
});

export const getArticleById = cache(async (id: string) => {
  return apiFetch<IArticle>(`/content/articles/${id}`);
});
