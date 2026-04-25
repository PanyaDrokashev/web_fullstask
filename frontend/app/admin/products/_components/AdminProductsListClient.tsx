"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ICatalogItem } from "@/shared/types/content";
import {
  deleteAdminProduct,
  getAdminProducts,
} from "@/shared/api/admin-products";
import AdminToastStack, {
  AdminToast,
} from "@/app/admin/_components/AdminToastStack";

interface Props {
  products: ICatalogItem[];
  initialNotice?: "created";
}

export default function AdminProductsListClient({
  products,
  initialNotice,
}: Props) {
  const router = useRouter();
  const handledNoticeRef = useRef<string | null>(null);
  const [items, setItems] = useState(products);
  const [toasts, setToasts] = useState<AdminToast[]>([]);

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
    if (initialNotice !== "created") {
      return;
    }
    if (handledNoticeRef.current === initialNotice) {
      return;
    }
    handledNoticeRef.current = initialNotice;

    pushToast({
      kind: "success",
      title: "Товар опубликован",
      description: "Новый товар успешно добавлен в каталог.",
    });
    router.replace("/admin/products");
  }, [initialNotice, router]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const refreshed = await getAdminProducts();
        if (!canceled) {
          setItems(refreshed);
        }
      } catch (error) {
        if (!canceled) {
          pushToast({
            kind: "danger",
            title: "Не удалось загрузить товары",
            description: error instanceof Error ? error.message : "Попробуйте обновить страницу",
          });
        }
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, []);

  const handleDelete = async (id: number) => {
    const shouldDelete = window.confirm("Удалить товар?");
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteAdminProduct(id);
      const refreshed = await getAdminProducts();
      setItems(refreshed);
      pushToast({
        kind: "success",
        title: "Товар удален",
        description: `Товар #${id} удален из каталога.`,
      });
    } catch (error) {
      pushToast({
        kind: "danger",
        title: "Не удалось удалить товар",
        description:
          error instanceof Error ? error.message : "Попробуйте еще раз.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-dark">Управление товарами</h1>
        <Link
          href="/admin/products/add"
          className="rounded-xl bg-[#c73f3f] px-5 py-3 text-white font-medium"
        >
          Добавить товар
        </Link>
      </div>

      <div className="grid gap-4">
        {items
          .slice()
          .sort((a, b) => b.id - a.id)
          .map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-[#00000010] bg-white p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-[#6a6a6a] mb-2">
                ID: {product.id}
              </p>
              <h2 className="text-xl font-semibold text-dark mb-2">{product.title}</h2>
              <p className="text-[#4a4a4a] mb-4">Категория: {product.tag ?? "-"}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/catalog/${product.id}`}
                  className="rounded-lg border border-[#00000020] px-4 py-2 text-sm text-dark"
                >
                  Открыть на сайте
                </Link>
                <button
                  type="button"
                  className="rounded-lg bg-[#d82525] px-4 py-2 text-sm text-white"
                  onClick={() => handleDelete(product.id)}
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
