'use client';

import PAGES from "@/config/pages";
import { getCatalogCardImageUrl } from "@/shared/api/catalog-assets";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import {useRouter} from "next/navigation";

interface ICatalogItemsProps {
  id: number;
  tag?: string;
  title: string;
  dir: string;
  img: string;
  firstColorTag?: string;
  price: Record<string, number>;
  priceTag: string;
  withBtn: boolean;
}

export default function CatalogCard({
  id,
  tag,
  title,
  dir,
  img,
  firstColorTag,
  price,
  priceTag,
  withBtn,
}: ICatalogItemsProps) {
  const router = useRouter();
  const cardImage = getCatalogCardImageUrl(dir, img, firstColorTag);

  return (
    <div className="p-4 bg-white rounded-2xl overflow-hidden relative h-[300px]">
      <div className="relative z-2 flex flex-col justify-between h-full">
        <div>
          {tag && (
            <div className="text-dark text-[12px] font-medium">{tag}</div>
          )}
          <Link
            href={PAGES.CATALOG + `/${id}`}
            className="text-dark font-semibold text-[20px]"
          >
            {title}
          </Link>
        </div>
        <div className="mt-auto flex justify-between  items-center">
          <div className={'bg-white p-2 rounded-md'}>
            <p className="font-medium  text-[14px] text-dark">
              от {price["Серый"]}₽
            </p>
            <p className="text-[12px] text-[#404040]">
              цена за {priceTag == "м2" ? <span>м&sup2;</span> : priceTag}
            </p>
          </div>
          {withBtn && (
            <Button color="primary" size="md" onPress={() => router.push(`catalog/${id}`)}>
              Добавить в корзину
            </Button>
          )}
        </div>
      </div>
      <div className="absolute w-full h-full inset-0 object-cover z-0">
        <Image width={'full'} height={'full'} className="w-full h-full object-center object-cover" src={cardImage} />
      </div>
    </div>
  );
}
