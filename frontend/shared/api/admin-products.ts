import { ICatalogItem, IProductDraft } from "@/shared/types/content";
import { getBackendApiBaseUrl } from "@/shared/api/base-url";
import { getFirebaseIdToken } from "@/shared/firebase/token";

const API_BASE_URL = getBackendApiBaseUrl();

async function fetchAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (typeof window !== "undefined") {
    const idToken = await getFirebaseIdToken();
    if (idToken) {
      headers.set("Authorization", `Bearer ${idToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });

  if (!response.ok) {
    const fallback = `Backend request failed: ${path} (${response.status})`;
    let message = fallback;

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      message = fallback;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getAdminProducts(): Promise<ICatalogItem[]> {
  return fetchAdmin<ICatalogItem[]>("/admin/products");
}

export async function createAdminProduct(draft: IProductDraft): Promise<ICatalogItem> {
  return fetchAdmin<ICatalogItem>("/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(draft),
  });
}

export async function uploadAdminProductColorImage(params: {
  dir: string;
  color: string;
  file: File;
}): Promise<{ path: string }> {
  const formData = new FormData();
  formData.set("dir", params.dir);
  formData.set("color", params.color.normalize("NFD"));
  formData.set("image", params.file);

  return fetchAdmin<{ path: string }>("/admin/products/color-image", {
    method: "POST",
    body: formData,
  });
}

export async function uploadAdminProductPreviewImage(params: {
  dir: string;
  file: File;
}): Promise<{ path: string }> {
  const formData = new FormData();
  formData.set("dir", params.dir);
  formData.set("image", params.file);

  return fetchAdmin<{ path: string }>("/admin/products/preview-image", {
    method: "POST",
    body: formData,
  });
}

export async function deleteAdminProduct(id: number): Promise<void> {
  return fetchAdmin<void>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}
