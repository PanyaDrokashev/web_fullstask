import Container from "@/components/Layout/Container";
import { requireAdmin } from "@/app/admin/_utils/requireAdmin";

import AdminArticlesListClient from "./_components/AdminArticlesListClient";

interface Props {
  searchParams?: Promise<{ notice?: string }>;
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = searchParams ? await searchParams : undefined;
  const notice =
    sp?.notice === "created" || sp?.notice === "updated" ? sp.notice : undefined;

  return (
    <section className="py-10">
      <Container>
        <AdminArticlesListClient initialArticles={[]} initialNotice={notice} />
      </Container>
    </section>
  );
}
