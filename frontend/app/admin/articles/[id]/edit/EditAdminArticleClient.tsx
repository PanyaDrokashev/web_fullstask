"use client";

import { useEffect, useState } from "react";

import { getAdminArticleById } from "@/shared/api/admin-articles";
import { IArticle } from "@/shared/types/content";
import AdminArticleForm from "../../_components/AdminArticleForm";

interface Props {
  articleID: number;
}

export default function EditAdminArticleClient({ articleID }: Props) {
  const [article, setArticle] = useState<IArticle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const nextArticle = await getAdminArticleById(articleID);
        if (!canceled) {
          setArticle(nextArticle);
          setError("");
        }
      } catch (loadError) {
        if (!canceled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить статью",
          );
        }
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, [articleID]);

  if (error) {
    return (
      <p className="rounded-xl border border-[#d82525] bg-[#fff2f2] px-4 py-3 text-sm text-[#b51717]">
        {error}
      </p>
    );
  }

  if (!article) {
    return <p className="text-sm text-[#505050]">Загружаем статью...</p>;
  }

  return <AdminArticleForm mode="edit" article={article} />;
}
