import { BackArrowIcon } from "@/components/Icons";
import Container from "@/components/Layout/Container";
import PAGES from "@/config/pages";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import ProductInfo from "./ProductInfo";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/Separator";
import Packing from "@/components/ui/Packing";
import Services from "@/components/ui/Services";
import { getCatalogItemById, getProductPageData } from "@/shared/api/content";
import { ICatalogItem } from "@/shared/types/content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  try {
    const product = await getCatalogItemById(id);

    return {
      title: product.title,
      description: product.description[0],
    };
  } catch {
    return { title: "Товар не найден" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  let currentProduct: ICatalogItem;
  try {
    currentProduct = await getCatalogItemById(id);
  } catch {
    notFound();
  }

  const productPageData = await getProductPageData();

  return (
    <section className="py-12">
      <Container>
        <Link href={PAGES.CATALOG}>
          <Button
            className="text-dark border-[#00000010] border-1"
            color="primary"
            startContent={<BackArrowIcon height={16} width={16} />}
          >
            К каталогу
          </Button>
        </Link>
        <ProductInfo product={currentProduct} />
        <div className="hidden md:block">
          <Separator className="my-12" />
          <Packing paragraphs={productPageData.packingParagraphs} />
          <Separator className="my-12" />
          <Services title={productPageData.servicesTitle} cards={productPageData.servicesCards} />
        </div>
      </Container>
    </section>
  );
}
