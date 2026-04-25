import { notFound } from "next/navigation";

import Article from "./Article";
import MoreArticles from "./MoreArticles";

import Container from "@/components/Layout/Container";
import PageTitle from "@/components/ui/PageTitle";
import { getArticleById, getArticles } from "@/shared/api/content";
import { IArticle } from "@/shared/types/content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  try {
    const article = await getArticleById(id);

    return {
      title: article.title,
      description: article.content[0]?.content,
    };
  } catch {
    return { title: "Статья не найдена" };
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;

  let currentArticle: IArticle;
  try {
    currentArticle = await getArticleById(id);
  } catch {
    notFound();
  }

  const articles = await getArticles();

  return (
    <>
      <PageTitle title="Статья" description={[currentArticle.title]} />
      <section className="py-12 md:py-16">
        <Container>
          <Article article={currentArticle} />
          <MoreArticles article={currentArticle} items={articles} />
        </Container>
      </section>
    </>
  );
}
