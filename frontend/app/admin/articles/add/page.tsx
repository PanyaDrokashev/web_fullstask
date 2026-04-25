import Container from "@/components/Layout/Container";
import { requireAdmin } from "@/app/admin/_utils/requireAdmin";

import AdminArticleForm from "../_components/AdminArticleForm";

export default async function AddAdminArticlePage() {
  await requireAdmin();

  return (
    <section className="py-10">
      <Container>
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#00000010] bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-dark mb-6">Новая статья</h1>
          <AdminArticleForm mode="create" />
        </div>
      </Container>
    </section>
  );
}
