'use client';

import { Button } from "@heroui/button";
import Container from "@/components/Layout/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { TrolleyIcon } from "@/components/Icons";
import { ICatalogItem } from "@/shared/types/content";
import CatalogItems from "@/components/ui/CatalogItems";
import PAGES from "@/config/pages";
import { Link } from "@heroui/link";
import {useRouter} from "next/navigation";

export default function Catalog({ items }: { items: ICatalogItem[] }) {
  const router = useRouter()
  return (
    <section className="py-8 md:py-12" id="catalog">
      <Container>
        <SectionTitle className="text-center" text="Каталог продукции BRUSKA" />
        <CatalogItems itemsToShow={4} items={items} />
        <div className="mt-6 flex flex-col xs:flex-row justify-center gap-3">
          <Link href={PAGES.CATALOG}>
            <Button
              className="max-xs:w-full text-white"
              color="secondary"
              endContent={<TrolleyIcon height={16} width={16} />}
            >
              Посмотреть весь каталог
            </Button>
          </Link>
          <Button
            className="text-dark border-1 border-[#00000010]"
            color="primary"
            variant="ghost"
            onPress={() => router.push(PAGES.CONTACTS)}
          >
            Оставить заявку
          </Button>
        </div>
      </Container>
    </section>
  );
}
