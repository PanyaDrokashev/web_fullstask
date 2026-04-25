import { Button } from "@heroui/button";

import { IInfoData } from "../page";

import { TrolleyIcon } from "@/components/Icons";
import Container from "@/components/Layout/Container";
import { Link } from "@heroui/link";
import PAGES from "@/config/pages";

function HeroInfoCard({ Icon, title }: IInfoData) {
  return (
    <div className="rounded-3xl flex flex-col gap-6 items-center p-8 bg-[#eeeeee06]">
      <Icon height={42} width={42} />
      <h3 className="font-medium text-center">{title}</h3>
    </div>
  );
}

export default function Hero({
  cardsData,
  heroTitle,
  heroSubtitle,
  heroLeadText,
}: {
  cardsData: IInfoData[];
  heroTitle: string;
  heroSubtitle: string;
  heroLeadText: string;
}) {
  return (
    <section className="bg-darkbg py-6 xs:py-12 md:py-16">
      <Container className="lg:grid lg:grid-cols-2 flex flex-col gap-6 xs:gap-12">
        <div className="info text-white flex flex-col justify-between">
          <div className="xs:pt-6">
            <h1 className="text-5xl font-bold">{heroTitle}</h1>
            <span className="mt-3 font-semibold text-2xl block">{heroSubtitle}</span>
            <div className="p-8 bg-[#3E3C3A] rounded-3xl mt-6">
              <h2 className="font-semibold text-2xl">{heroLeadText}</h2>
              <div className="flex flex-col xs:flex-row gap-3 mt-6">
                <Link href={PAGES.CATALOG}>
                  <Button className="text-white max-xs:w-full" color="secondary" endContent={<TrolleyIcon height={16} width={16} />}>
                    Посмотреть каталог
                  </Button>
                </Link>
                <a href="#catalog">
                  <Button className="text-dark max-xs:w-full" color="primary" variant="solid">
                    Популярные позиции
                  </Button>
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6 xs:mt-16">
            {cardsData.map((card) => (
              <HeroInfoCard key={card.title} Icon={card.Icon} title={card.title} />
            ))}
          </div>
        </div>
        <div className="video h-75 lg:h-[780px] rounded-2xl overflow-hidden">
          <video
            autoPlay
            muted
            playsInline
            className="lg:h-full w-full object-cover"
            poster="/main-video-poster.png"
            src="/videos/video.mp4"
          />
        </div>
      </Container>
    </section>
  );
}
