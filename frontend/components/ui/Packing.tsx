import { Image } from "@heroui/image";
import SectionTitle from "./SectionTitle";

const defaultParagraphs = [
  "Брусчатка упаковывается на поддоны, что обеспечивает безопасную транспортировку и сохранность изделий. Из-за большого веса бетонных плиток коробки или ящики использовать нельзя — они не выдержат нагрузку. Для дополнительной защиты и надежности поддоны оборачиваются стрейч-пленкой.",
  "Знание характеристик упаковки важно перед покупкой. Это позволяет правильно рассчитать расходы на транспортировку и разгрузку, спланировать работу и избежать лишних затрат и усилий.",
];

export default function Packing({ paragraphs = defaultParagraphs }: { paragraphs?: string[] }) {
  return (
    <div>
      <SectionTitle text="Упаковка" className="mb-7" />
      <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
        <div className="py-8 px-5 col-start-1 col-end-7 flex flex-col gap-2 bg-white shadow border-1 border-[#00000010] rounded-3xl">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="w-full col-start-7 col-end-13">
          <Image src="/product/pack_table.png" />
        </div>
      </div>
    </div>
  );
}
