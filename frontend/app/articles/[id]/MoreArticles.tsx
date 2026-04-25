import { IArticleProps } from "./Article";

import ArticleItem from "@/components/ui/ArticleItem";
import SectionTitle from "@/components/ui/SectionTitle";
import { IArticle } from "@/shared/types/content";

export default function MoreArticles({ article, items }: IArticleProps & { items: IArticle[] }) {
  return (
    <div className="mt-12 md:mt-24">
      <SectionTitle className="mb-8 text-center md:text-left md:mb-12" text="Другие статьи" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, idx) => {
          if (idx < 4 && item.id !== article.id) {
            return <ArticleItem key={item.id} article={item} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
