"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminArticle,
  updateAdminArticle,
} from "@/shared/api/admin-articles";
import { IArticle, IArticleDraft, IArticlePart } from "@/shared/types/content";
import WysiwygBlocksEditor from "./WysiwygBlocksEditor";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  article?: IArticle;
}

function extractBody(article?: IArticle) {
  return article?.content ?? [];
}

export default function AdminArticleForm({ mode, article }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const initialBlocks = useMemo(() => extractBody(article), [article]);

  const [title, setTitle] = useState(article?.title ?? "");
  const [preview, setPreview] = useState(article?.preview ?? "");
  const [blocks, setBlocks] = useState<IArticlePart[]>(initialBlocks);

  const submitLabel = mode === "create" ? "Создать" : "Сохранить";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const draft: IArticleDraft = {
      title,
      preview,
      blocks,
    };

    try {
      if (mode === "create") {
        await createAdminArticle(draft);
        router.push("/admin/articles?notice=created");
      } else if (article) {
        await updateAdminArticle(article.id, draft);
        router.push("/admin/articles?notice=updated");
      }
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось сохранить статью",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="article-title" className="block text-sm font-medium text-dark">
          Заголовок
        </label>
        <input
          id="article-title"
          className="w-full rounded-xl border border-[#00000020] px-4 py-3 outline-none focus:border-[#c73f3f]"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Введите заголовок"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="article-preview" className="block text-sm font-medium text-dark">
          Краткое описание
        </label>
        <textarea
          id="article-preview"
          className="w-full rounded-xl border border-[#00000020] px-4 py-3 outline-none focus:border-[#c73f3f] min-h-[90px]"
          value={preview}
          onChange={(event) => setPreview(event.target.value)}
          placeholder="Короткий анонс статьи"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-dark">Содержимое статьи</label>
        <WysiwygBlocksEditor value={blocks} onChange={setBlocks} />
      </div>

      {error ? (
        <p className="rounded-xl border border-[#d82525] bg-[#fff2f2] px-4 py-3 text-sm text-[#b51717]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-[#c73f3f] px-5 py-3 text-white font-medium disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Сохраняем..." : submitLabel}
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#00000020] px-5 py-3 text-dark"
          onClick={() => router.push("/admin/articles")}
          disabled={isLoading}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
