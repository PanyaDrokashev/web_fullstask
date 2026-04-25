"use client";

import { Image } from "@heroui/image";
import { Link } from "@heroui/link";

import { IArticle, IArticlePart } from "@/shared/types/content";
import PAGES from "@/config/pages";

interface IArticleProps {
  isNew?: boolean;
  article: IArticle;
}

const getFirstTextContent = (articleParts: IArticlePart[]): string => {
  const textPart = articleParts.find((part) => part.type === "text");

  return textPart?.content ?? "";
};

export default function ArticleItem({ article, isNew }: IArticleProps) {
  return (
    <div className="p-4 flex-col xs:flex-row bg-white rounded-3xl border-1 border-[#00000010] flex gap-4">
      <div className="xs:shrink-0">
        <Image className="rounded-xl object-cover xs:aspect-square" src={article.preview} width={200} height={200} />
      </div>
      <div className="flex flex-col justify-between">
        {isNew && <span className="text-[12px] text-dark font-medium">НОВОЕ</span>}
        <h3 className={`font-medium text-dark ${isNew ? "line-clamp-1" : "line-clamp-2"}`}>{article.title}</h3>
        <p className="text-[14px] leading-[144%] text-[#737373] line-clamp-3 xs:line-clamp-6">
          {getFirstTextContent(article.content)}
        </p>
        <Link className="relative text-dark hover:underline mt-2 self-start" href={`${PAGES.ARTICLES}/${article.id}`}>
          Читать подробнее
          <svg
            className="absolute top-0.5 -right-3"
            fill="none"
            height="11"
            viewBox="0 0 9 11"
            width="9"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_9810_1190)">
              <path
                d="M2.20598 9.84345L1.37988 9.01735L5.526 4.86732H2.37825L2.38607 3.73193H7.48748V8.83726H6.34427L6.35209 5.69342L2.20598 9.84345Z"
                fill="#737373"
              />
            </g>
            <defs>
              <clipPath id="clip0_9810_1190">
                <rect fill="white" height="9" transform="translate(0 2)" width="9" />
              </clipPath>
            </defs>
          </svg>
        </Link>
      </div>
    </div>
  );
}
