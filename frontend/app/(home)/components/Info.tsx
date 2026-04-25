import { IInfoData } from "../page";

import MainSlider from "@/components/ui/Slider";

import Container from "@/components/Layout/Container";
import { Logo } from "@/components/Icons";

function MainInfoCard({ Icon, title, text }: IInfoData) {
  return (
    <div className="flex flex-col text-center xs:text-left xs:flex-row gap-6 p-8 bg-white shadow rounded-[56px] items-center">
      <div className="shrink-0 rounded-3xl w-28 h-28 flex justify-center items-center bg-[#FFEDD1] shadow">
        <Icon fill="#9A3412" height={48} width={48} />
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function Info({
  cardsData,
  infoLeadText,
}: {
  cardsData: IInfoData[];
  infoLeadText: string;
}) {
  return (
    <section className="pb-8 md:pb-12">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <div className="shadow-xl rounded-3xl p-8">
            <div className="max-w-full">
              <Logo height={75} width={332} className="max-w-full" />
            </div>
            <p className="mt-6">{infoLeadText}</p>
          </div>
          <MainSlider sliderHeight="h-80" imagesDir="/slides/main" />
        </div>
        <div className="flex flex-col justify-between gap-2">
          {cardsData.map((card) => (
            <MainInfoCard key={card.title} Icon={card.Icon} text={card.text} title={card.title} />
          ))}
        </div>
      </Container>
    </section>
  );
}
