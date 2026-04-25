import { notFound } from "next/navigation";

import Container from "@/components/Layout/Container";
import { requireAdmin } from "@/app/admin/_utils/requireAdmin";
import EditAdminArticleClient from "./EditAdminArticleClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAdminArticlePage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  const articleID = Number(id);

  if (!Number.isInteger(articleID) || articleID <= 0) {
    notFound();
  }

  return (
    <section className="py-10">
      <Container>
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#00000010] bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-dark mb-6">Редактирование статьи</h1>
          <EditAdminArticleClient articleID={articleID} />
        </div>
      </Container>
    </section>
  );
}
