"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminProduct,
  uploadAdminProductColorImage,
  uploadAdminProductPreviewImage,
} from "@/shared/api/admin-products";
import { IProductDraft } from "@/shared/types/content";

type ColorFormItem = {
  id: number;
  tag: string;
  price: number;
  file: File | null;
};

const initialDraft: IProductDraft = {
  category: "Прочее",
  title: "",
  dir: "",
  img: "",
  priceTag: "м2",
  basePrice: 1000,
  color: "Серый",
  colors: [],
  description: "",
  onPallet: 10,
  weight: 1000,
  length: 100,
  width: 100,
  height: 60,
  withBtn: false,
  isAvailable: true,
};

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function toLatinSlug(input: string): string {
  const normalized = input.trim().toLowerCase();
  let out = "";

  for (const ch of normalized) {
    if (translitMap[ch] !== undefined) {
      out += translitMap[ch];
      continue;
    }

    if (/[a-z0-9]/.test(ch)) {
      out += ch;
      continue;
    }

    if (/\s|[-_]/.test(ch)) {
      out += "-";
    }
  }

  return out.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProductForm() {
  const router = useRouter();
  const [form, setForm] = useState<IProductDraft>(initialDraft);
  const [colors, setColors] = useState<ColorFormItem[]>([
    { id: 1, tag: "Серый", price: 1000, file: null },
  ]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [dirTouched, setDirTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedDir = useMemo(() => {
    const fromTitle = toLatinSlug(form.title);
    return form.dir || fromTitle;
  }, [form.dir, form.title]);

  const addColor = () => {
    setColors((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        tag: "",
        price: 1000,
        file: null,
      },
    ]);
  };

  const removeColor = (id: number) => {
    setColors((prev) => prev.filter((item) => item.id !== id));
  };

  const updateColor = (id: number, patch: Partial<ColorFormItem>) => {
    setColors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validColors = colors
      .map((item) => ({
        tag: item.tag.trim(),
        price: Number(item.price),
        file: item.file,
      }))
      .filter((item) => item.tag && item.price > 0);

    if (validColors.length === 0) {
      setError("Добавьте хотя бы один цвет с ценой.");
      return;
    }

    const dirValue = normalizedDir;
    if (!dirValue) {
      setError("Не удалось сформировать папку товара. Укажите название или dir.");
      return;
    }
    if (!previewFile) {
      setError("Загрузите превью товара.");
      return;
    }

    setIsLoading(true);

    try {
      const previewUpload = await uploadAdminProductPreviewImage({
        dir: dirValue,
        file: previewFile,
      });

      const payload: IProductDraft = {
        ...form,
        dir: dirValue,
        img: previewUpload.path,
        colors: validColors.map((item) => ({ tag: item.tag, price: item.price })),
      };

      await createAdminProduct(payload);

      for (const color of validColors) {
        if (!color.file) {
          continue;
        }

        await uploadAdminProductColorImage({
          dir: dirValue,
          color: color.tag,
          file: color.file,
        });
      }

      router.push("/admin/products?notice=created");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось создать товар",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          placeholder="Название товара"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((prev) => ({
              ...prev,
              title,
              dir: dirTouched ? prev.dir : toLatinSlug(title),
            }));
          }}
          required
        />
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          placeholder="Категория (tag)"
          value={form.category}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, category: e.target.value }))
          }
          required
        />
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          placeholder="dir (латиница, уникально)"
          value={form.dir}
          onChange={(e) => {
            setDirTouched(true);
            setForm((prev) => ({ ...prev, dir: e.target.value }));
          }}
          required
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark">Превью</label>
          <input
            className="w-full rounded-xl border border-[#00000020] px-4 py-3"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          placeholder="Единица цены (м2/шт)"
          value={form.priceTag}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, priceTag: e.target.value }))
          }
          required
        />
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          type="number"
          min="1"
          step="0.01"
          placeholder="Вес"
          value={form.weight}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))
          }
          required
        />
        <input
          className="rounded-xl border border-[#00000020] px-4 py-3"
          type="number"
          min="1"
          step="0.01"
          placeholder="На поддоне"
          value={form.onPallet}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, onPallet: Number(e.target.value) }))
          }
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded-xl border border-[#00000020] px-3 py-3"
            type="number"
            min="1"
            value={form.length}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, length: Number(e.target.value) }))
            }
            placeholder="Длина"
            required
          />
          <input
            className="rounded-xl border border-[#00000020] px-3 py-3"
            type="number"
            min="1"
            value={form.width}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, width: Number(e.target.value) }))
            }
            placeholder="Ширина"
            required
          />
          <input
            className="rounded-xl border border-[#00000020] px-3 py-3"
            type="number"
            min="1"
            value={form.height}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, height: Number(e.target.value) }))
            }
            placeholder="Высота"
            required
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#00000010] bg-[#fafafa] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-dark">Цвета товара</p>
          <button
            type="button"
            className="rounded-lg border border-[#00000020] px-3 py-2 text-sm"
            onClick={addColor}
          >
            Добавить цвет
          </button>
        </div>

        <div className="space-y-3">
          {colors.map((color, index) => (
            <div key={color.id} className="grid gap-3 rounded-xl border border-[#00000010] bg-white p-3 sm:grid-cols-4">
              <input
                className="rounded-lg border border-[#00000020] px-3 py-2"
                placeholder="Цвет"
                value={color.tag}
                onChange={(e) => updateColor(color.id, { tag: e.target.value })}
                required
              />
              <input
                className="rounded-lg border border-[#00000020] px-3 py-2"
                type="number"
                min="1"
                step="0.01"
                placeholder="Цена за цвет"
                value={color.price}
                onChange={(e) =>
                  updateColor(color.id, { price: Number(e.target.value) })
                }
                required
              />
              <input
                className="rounded-lg border border-[#00000020] px-3 py-2"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={(e) =>
                  updateColor(color.id, {
                    file: e.target.files?.[0] ?? null,
                  })
                }
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-[#00000020] px-3 py-2 text-sm"
                  onClick={() => removeColor(color.id)}
                  disabled={colors.length === 1}
                >
                  Удалить
                </button>
              </div>
              <p className="sm:col-span-4 text-xs text-[#686868]">
                Цвет #{index + 1}: файл будет сохранен в `assets/catalog/{normalizedDir}/{`{цвет}`}`.
              </p>
            </div>
          ))}
        </div>
      </div>

      <textarea
        className="w-full rounded-xl border border-[#00000020] px-4 py-3 min-h-[120px]"
        placeholder="Описание товара"
        value={form.description}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, description: e.target.value }))
        }
      />

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))
            }
          />
          В наличии
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.withBtn}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, withBtn: e.target.checked }))
            }
          />
          Показывать кнопку "Добавить в корзину"
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#d82525] bg-[#fff2f2] px-4 py-3 text-sm text-[#b51717]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-[#c73f3f] px-5 py-3 text-white font-medium disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Создаем..." : "Создать товар"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#00000020] px-5 py-3 text-dark"
          onClick={() => router.push("/admin/products")}
          disabled={isLoading}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
