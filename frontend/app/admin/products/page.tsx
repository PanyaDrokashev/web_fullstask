import Container from "@/components/Layout/Container";
import { requireAdmin } from "@/app/admin/_utils/requireAdmin";
import AdminProductsListClient from "./_components/AdminProductsListClient";

interface Props {
  searchParams?: Promise<{ notice?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = searchParams ? await searchParams : undefined;
  const notice = sp?.notice === "created" ? "created" : undefined;

  return (
    <section className="py-10">
      <Container>
        <AdminProductsListClient products={[]} initialNotice={notice} />
      </Container>
    </section>
  );
}
