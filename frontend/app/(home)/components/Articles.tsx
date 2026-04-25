import ArticleItem from "@/components/ui/ArticleItem";
import Container from "@/components/Layout/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { IArticle } from "@/shared/types/content";

export default function Articles({ items }: { items: IArticle[] }) {
  return (
    <section className="pt-8 md:pt-12">
      <Container>
        <SectionTitle className="text-center" text="Статьи" />
        <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((article, idx) =>
            idx < 4 ? <ArticleItem key={article.id} article={article} isNew={idx === 0} /> : null
          )}
        </div>
      </Container>
    </section>
  );
}
