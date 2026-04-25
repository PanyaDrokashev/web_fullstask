import CatalogItems from "@/components/ui/CatalogItems";
import Container from "@/components/Layout/Container";
import PageTitle from "@/components/ui/PageTitle";
import { getCatalogItems } from "@/shared/api/content";

export async function generateMetadata() {
  return {
    title: "Каталог продукции Bruska",
    description:
      "Миссия BRUSKA — производить надежную и высококачественную плитку, обеспечивая клиентов продукцией, отвечающей самым высоким стандартам. Компания ценит стабильность поставок, качество продукции и постоянное внедрение инноваций для достижения лучших результатов.",
  };
}

export default async function CatalogPage() {
  const catalogItems = await getCatalogItems();

  return (
    <section className="mb-16">
      <PageTitle
        title="Каталог продукции BRUSKA"
        description={[
          "Брусчатка, бордюры, тротуарная плитка и элементы благоустройства. Собственное производство, контроль качества на каждом этапе.",
        ]}
      />
      <Container>
        <CatalogItems items={catalogItems} />
      </Container>
    </section>
  );
}
