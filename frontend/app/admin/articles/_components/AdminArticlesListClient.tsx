"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteAdminArticle,
  getAdminArticlesEventsUrl,
  getAdminArticles,
  parseAdminArticleEvent,
} from "@/shared/api/admin-articles";
import { IAdminArticleEvent, IArticle } from "@/shared/types/content";
import AdminToastStack, {
  AdminToast,
  AdminToastKind,
} from "@/app/admin/_components/AdminToastStack";

interface Props {
  initialArticles: IArticle[];
  initialNotice?: "created" | "updated";
}

const eventText: Record<IAdminArticleEvent["type"], string> = {
  created: "Создана новая статья",
  updated: "Статья обновлена",
  deleted: "Статья удалена",
};

const eventTone: Record<IAdminArticleEvent["type"], AdminToastKind> = {
  created: "success",
  updated: "info",
  deleted: "danger",
};

export default function AdminArticlesListClient({
  initialArticles,
  initialNotice,
}: Props) {
  const router = useRouter();
  const handledNoticeRef = useRef<string | null>(null);
  const [articles, setArticles] = useState(initialArticles);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => b.id - a.id),
    [articles],
  );

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = (toast: Omit<AdminToast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  useEffect(() => {
    if (!initialNotice) {
      return;
    }
    if (handledNoticeRef.current === initialNotice) {
      return;
    }
    handledNoticeRef.current = initialNotice;

    if (initialNotice === "created") {
      pushToast({
        kind: "success",
        title: "Статья опубликована",
        description: "Новая статья успешно добавлена в коллекцию.",
      });
    }

    if (initialNotice === "updated") {
      pushToast({
        kind: "info",
        title: "Изменения сохранены",
        description: "Статья успешно обновлена.",
      });
    }

    router.replace("/admin/articles");
  }, [initialNotice, router]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const nextArticles = await getAdminArticles();
        if (!canceled) {
          setArticles(nextArticles);
        }
      } catch (loadError) {
        if (!canceled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить список статей",
          );
        }
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let closed = false;
    let source: EventSource | null = null;

    const connect = async () => {
      try {
        const eventsURL = await getAdminArticlesEventsUrl();
        if (closed) {
          return;
        }
        source = new EventSource(eventsURL);

        source.addEventListener("article", async (event) => {
          try {
            const parsed = parseAdminArticleEvent(event as MessageEvent<string>);

            if (closed) {
              return;
            }

            pushToast({
              kind: eventTone[parsed.type],
              title: eventText[parsed.type],
              description: `#${parsed.articleId}${parsed.title ? ` - ${parsed.title}` : ""}`,
            });
            setIsRefreshing(true);
            const nextArticles = await getAdminArticles();
            if (!closed) {
              setArticles(nextArticles);
              setError("");
            }
          } catch (sseError) {
            if (!closed) {
              setError(
                sseError instanceof Error
                  ? sseError.message
                  : "Не удалось обработать обновление",
              );
            }
          } finally {
            if (!closed) {
              setIsRefreshing(false);
            }
          }
        });

        source.onerror = () => {
          if (!closed) {
            setError("Поток обновлений временно недоступен");
          }
        };
      } catch (connectError) {
        if (!closed) {
          setError(
            connectError instanceof Error
              ? connectError.message
              : "Поток обновлений временно недоступен",
          );
        }
      }
    };

    void connect();

    return () => {
      closed = true;
      source?.close();
    };
  }, []);

  const handleDelete = async (id: number) => {
    const shouldDelete = window.confirm("Удалить статью?");
    if (!shouldDelete) {
      return;
    }

    setError("");

    try {
      await deleteAdminArticle(id);
      const nextArticles = await getAdminArticles();
      setArticles(nextArticles);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить статью",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-dark">Управление статьями</h1>
        <Link
          href="/admin/articles/add"
          className="rounded-xl bg-[#c73f3f] px-5 py-3 text-white font-medium"
        >
          Добавить статью
        </Link>
      </div>

      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />

      {isRefreshing ? (
        <p className="text-sm text-[#505050]">Обновляем список по событию SSE...</p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#d82525] bg-[#fff2f2] px-4 py-3 text-sm text-[#b51717]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        {sortedArticles.map((article) => (
          <article
            key={article.id}
            className="rounded-2xl border border-[#00000010] bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-[#6a6a6a] mb-2">
              ID: {article.id}
            </p>
            <h2 className="text-xl font-semibold text-dark mb-2">{article.title}</h2>
            <p className="text-[#4a4a4a] mb-4">{article.preview}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/articles/${article.id}`}
                className="rounded-lg border border-[#00000020] px-4 py-2 text-sm text-dark"
              >
                Открыть на сайте
              </Link>
              <Link
                href={`/admin/articles/${article.id}/edit`}
                className="rounded-lg border border-[#00000020] px-4 py-2 text-sm text-dark"
              >
                Редактировать
              </Link>
              <button
                type="button"
                className="rounded-lg bg-[#d82525] px-4 py-2 text-sm text-white"
                onClick={() => handleDelete(article.id)}
              >
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
