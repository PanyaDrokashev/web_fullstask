import Link from "next/link";

import Container from "@/components/Layout/Container";
import { requireAdmin } from "@/app/admin/_utils/requireAdmin";
import AdminRegisterUserForm from "@/app/admin/_components/AdminRegisterUserForm";

export default async function AdminPanelPage() {
  await requireAdmin();

  const blocks = [
    {
      title: "Статьи",
      description:
        "Добавляйте и редактируйте статьи, следите за обновлениями коллекции в реальном времени.",
      actions: [
        { href: "/admin/articles", label: "Просмотр статей" },
        { href: "/admin/articles/add", label: "Добавить статью" },
      ],
    },
    {
      title: "Товары",
      description:
        "Смотрите текущий каталог и добавляйте новые товары в базу данных.",
      actions: [
        { href: "/admin/products", label: "Просмотр товаров" },
        { href: "/admin/products/add", label: "Добавить товар" },
      ],
    },
  ];

  return (
    <section className="py-16">
      <Container>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold text-dark mb-3">Админ-панель</h1>
          <p className="text-[#404040] mb-8">
            Выберите раздел для управления контентом сайта.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {blocks.map((block) => (
              <article
                key={block.title}
                className="rounded-3xl border border-[#00000010] bg-white p-6 shadow"
              >
                <h2 className="text-2xl font-semibold text-dark mb-3">{block.title}</h2>
                <p className="text-[#404040] mb-5">{block.description}</p>
                <div className="flex flex-wrap gap-3">
                  {block.actions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rounded-xl border border-[#00000020] px-4 py-2 text-dark"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6">
            <AdminRegisterUserForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
