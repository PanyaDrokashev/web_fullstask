import { IAdminArticleEvent, IArticle, IArticleDraft } from "@/shared/types/content";
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

export async function getAdminArticlesEventsUrl(): Promise<string> {
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    throw new Error("Требуется вход в систему");
  }
  return `${API_BASE_URL}/admin/articles/events?access_token=${encodeURIComponent(idToken)}`;
}

export async function getAdminArticles(): Promise<IArticle[]> {
  return fetchAdmin<IArticle[]>("/admin/articles");
}

export async function getAdminArticleById(id: number): Promise<IArticle> {
  return fetchAdmin<IArticle>(`/admin/articles/${id}`);
}

export async function createAdminArticle(draft: IArticleDraft): Promise<IArticle> {
  return fetchAdmin<IArticle>("/admin/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(draft),
  });
}

export async function updateAdminArticle(
  id: number,
  draft: IArticleDraft,
): Promise<IArticle> {
  return fetchAdmin<IArticle>(`/admin/articles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(draft),
  });
}

export async function deleteAdminArticle(id: number): Promise<void> {
  return fetchAdmin<void>(`/admin/articles/${id}`, {
    method: "DELETE",
  });
}

export function parseAdminArticleEvent(raw: MessageEvent<string>): IAdminArticleEvent {
  return JSON.parse(raw.data) as IAdminArticleEvent;
}
