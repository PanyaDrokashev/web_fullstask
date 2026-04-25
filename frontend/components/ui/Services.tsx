"use client";

import { Button } from "@heroui/button";
import SectionTitle from "./SectionTitle";
import PAGES from "@/config/pages";
import { useRouter } from "next/navigation";
import { IServicesCardData } from "@/shared/types/content";

const defaultCards: IServicesCardData[] = [
  {
    title: "Доставка",
    items: [
      "Собственный парк грузовых авто.",
      "Машины грузоподъемностью 30-40 тонн.",
      "Доставка по г. Самаре и области.",
      "Срок поставки – от 1 дня.",
    ],
  },
  {
    title: "Аренда + Ремонт",
    text: "Компания «СКУ-22» предоставляет в аренду самосвалы и спецтехнику для реализации проектов дорожного или иного строительства. Ремонт автомобилей: HOWO, FAW, DAF, SCANIA, MAN, XCMG, XGMA, Lonking, МАЗ, КАМАЗ. Капитальный ремонт двигателей, ремонт ходовой части, тормозных систем, рулевого управления, сцепления. Сварочные работы: ремонт кабин, усиление рамы, шасси, кузова.",
  },
];

export default function Services({
  title = "Транспортные услуги",
  cards = defaultCards,
}: {
  title?: string;
  cards?: IServicesCardData[];
}) {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-wrap gap-3 xs:gap-6">
        <SectionTitle text={title} />
        <Button
          className="max-xs:m-auto text-dark border-1 bg-white border-[#00000010]"
          color="primary"
          size="lg"
          variant="solid"
          onPress={() => router.push(PAGES.CONTACTS)}
        >
          Оставить заявку
        </Button>
      </div>
      <div className="flex flex-col xs:grid xs:grid-cols-12 place-items-start gap-6 mt-4 xs:mt-7">
        {cards.map((card, idx) => (
          <div
            key={card.title}
            className={
              idx === 0
                ? "max-xs:w-full py-8 px-5 col-span-6 md:col-start-1 md:col-end-5 flex flex-col gap-2 bg-white shadow border-1 border-[#00000010] rounded-3xl"
                : "py-8 px-5 col-span-6 md:col-start-5 md:col-end-13 flex flex-col gap-2 bg-white shadow border-1 border-[#00000010] rounded-3xl"
            }
          >
            <h3 className="font-bold">{card.title}</h3>
            {card.items?.length ? (
              <ul className="list-disc pl-6">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {card.text ? <p>{card.text}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
