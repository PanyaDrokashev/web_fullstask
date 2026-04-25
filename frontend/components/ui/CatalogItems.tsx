import CatalogCard from "./CatalogCard";
import { ICatalogItem } from "@/shared/types/content";

interface ICatalogItemsProps {
  items: ICatalogItem[];
  itemsToShow?: number;
}

export default function CatalogItems({ items, itemsToShow }: ICatalogItemsProps) {
  return (
    <div className="grid grid-col-1 xs:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 md:mt-12">
      {itemsToShow
        ? items.map((item, idx) =>
            idx < itemsToShow ? (
              <CatalogCard
                key={item.id}
                id={item.id}
                dir={item.dir}
                img={item.img}
                firstColorTag={item.colors[0]?.tag}
                price={item.price}
                priceTag={item.priceTag}
                tag={item.tag}
                title={item.title}
                withBtn
              />
            ) : null
          )
        : items.map((item) => (
            <CatalogCard
              id={item.id}
              key={item.title}
              dir={item.dir}
              img={item.img}
              firstColorTag={item.colors[0]?.tag}
              price={item.price}
              priceTag={item.priceTag}
              tag={item.tag}
              title={item.title}
              withBtn
            />
          ))}
    </div>
  );
}
