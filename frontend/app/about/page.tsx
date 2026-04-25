import Container from "@/components/Layout/Container";
import Packing from "@/components/ui/Packing";
import PageTitle from "@/components/ui/PageTitle";
import SectionTitle from "@/components/ui/SectionTitle";
import Services from "@/components/ui/Services";
import { Button } from "@heroui/button";
import Image from "next/image";

export async function generateMetadata() {
  return {
    title: "О компании Bruska",
    description:
      "Мы готовы стать Вашим надежным партнером.\n Наша цель – эталонное ведение бизнеса в области поставок строительных материалов.",
  };
}

export default function AboutPage() {
  return (
    <div>
      <PageTitle
        title={"О компании"}
        description={[
          "ООО «Самарское карьероуправление-22»",
          "Наш продукт прошел обязательную сертификацию и соответствует ГОСТ 17608-2017 “ПЛИТЫ БЕТОННЫЕ ТРОТУАРНЫЕ”.",
        ]}
      />
      <Container>
        <section className="grid items-center grid-cols-1 md:grid-cols-2 gap-6 py-6 xs:pt-12 md:pt-30 xs:pb-12">
          <div className="xs:text-2xl xs:font-bold leading-snug">
            <p className="mb-6">
              Мы используем высококачественные материалы: высокопрочный цемент,
              крупномодульный песок, премиальные добавки и колеры, чтобы создать
              продукт, который не только выглядит красиво, но и обладает
              долговечностью и прочностью.
            </p>
            <p>
              Наша цель – эталонное ведение бизнеса в области поставок
              строительных материалов.
            </p>
          </div>
          <div>
            <video
              autoPlay
              muted
              controls
              className="h-full w-full object-cover rounded-2xl"
              poster="/main-video-poster.png"
              src="/videos/about.mp4"
            />
            {/*<Image*/}
            {/*  src="/main_slider/slider-4.png"*/}
            {/*  width={596}*/}
            {/*  height={337}*/}
            {/*  alt=""*/}
            {/*/>*/}
          </div>
        </section>
        <section className="py-4 md:py-12">
          <div className="flex flex-col-reverse md:grid grid-cols-6 md:grid-cols-12 gap-12">
            <div className="p-8 col-span-4 md:col-start-1 md:col-end-7 flex flex-col gap-2 bg-white shadow border-1 border-[#00000010] rounded-3xl">
              <h3 className="font-bold mb-6">
                ООО «Самарское карьероуправление-22»
              </h3>
              <p>
                BRUSKA — торговая марка компании «Самарское Карьерное
                Управление-22», которая занимается комплексным снабжением
                инертными материалами строительные и дорожные объекты, а так же
                объекты коммунального хозяйства и объекты частного
                строительства. Одним из видов деятельности компании, является
                производство высококачественной плитки под маркой BRUSKA.
                Основанная с целью обеспечения стабильных поставок и контроля
                качества, BRUSKA занимает прочные позиции на рынке благодаря
                использованию собственных ресурсов и современным технологиям.
              </p>
              <p>
                Основное направление деятельности компании – это комплексное,
                оперативное снабжение различных предприятий, объектов нерудными
                инертными материалами (песок, щебень и т.д.). В 2023 году была
                закуплена и смонтирована первая, полностью автоматическая линия
                по производству брусчатки “Protos”. На данный момент
                организовано производство нескольких видов брусчатки и
                бордюрного камня.
              </p>
              <p>
                Наш продукт прошел обязательную сертификацию и соответствует
                ГОСТ 17608-2017 “ПЛИТЫ БЕТОННЫЕ ТРОТУАРНЫЕ”. Брусчатка - это
                современное и функциональное решение для улучшения внешнего вида
                и комфорта вашего двора или территории. Этот продукт изготовлен
                с использованием новейших технологий и материалов, что
                гарантирует его высокое качество и долговечность.
              </p>
              <p>
                Одним из ключевых преимуществ брусчатки является точная
                геометрия, что позволяет создать гладкую и ровную поверхность,
                которая будет удобна для ходьбы и будет предотвращать
                скольжение. Это делает брусчатку идеальным выбором для различных
                наружных проектов, таких как садовые дорожки, террасы, патио и
                другие. Важно отметить, что наш продукт изготавливается с
                индивидуальным подходом к каждому заказу, что позволяет нам
                соответствовать вашим потребностям и предпочтениям.
              </p>
            </div>
            <div className="col-span-2 md:col-start-7 md:col-end-13 max-md:items-center flex flex-col gap-6">
              <Image
                width={632}
                height={850}
                className="max-xs:w-[70%] shadow"
                src="/about/certificate.png"
                alt={""}
              />
              <Button
                className="text-dark border-1 self-start max-md:m-auto border-[#00000010]"
                color="primary"
                size="lg"
                variant="solid"
              >
                Скачать документ
              </Button>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-6 py-4 md:py-12">
          <div className="col-start-1 col-end-3">
            <Image src="/about/top.png" alt={""} height={700} width={1280} />
          </div>
          <div>
            <Image src="/about/left.png" alt={""} height={500} width={630} />
          </div>
          <div>
            <Image src="/about/right.png" alt={""} height={500} width={630} />
          </div>
        </section>
        <section className="py-4 md:py-12">
          <SectionTitle
            text="Основные направления деятельности"
            className="mb-7"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center md:place-items-start md:place-items-center">
            <div className="p-8 bg-white shadow border-1 border-[#00000010] rounded-3xl">
              <ol className="list-decimal flex flex-col gap-2 pl-4">
                <li className="marker:font-bold">
                  <span className="font-bold">Добыча сырья</span>
                  <p>
                    Компания «СКУ-22» занимается добычей песка и ПГС. Добыча
                    производится со дна обводненных карьеров на р.Волга,
                    посредством гидроразмыва и погрузки в баржи земснарядом.
                    Затем осуществляется доставка, с помощью барж проекта Р-85,
                    до площадок выгрузки, где посредством гидронамыва и
                    применением специализированной тяжёлой техники формируется
                    карта, откуда затем ведётся отгрузка на собственное
                    производство и сторонним потребителям
                  </p>
                </li>
                <li className="marker:font-bold">
                  <span className="font-bold">
                    Транспортировка и подготовка сырья
                  </span>
                  <p>
                    После добычи, перевозки речным флотом и выгрузки на карты,
                    песок с помощью специализированной техники доставляется к
                    производственным цехам. В цехах сырье тщательно 
                    распределяется и подготавливается в специализированных
                    бункерах, что обеспечивает его равномерность и высокое
                    качество.
                  </p>
                </li>
                <li className="marker:font-bold">
                  <span className="font-bold">Производство плитки</span>
                  <p>
                    На предприятии используется современное оборудование,
                    позволяющее выпускать плитку высокого качества. Весь
                    производственный процесс автоматизирован и контролируется на
                    каждом этапе для соблюдения строгих стандартов.
                  </p>
                </li>
                <li className="marker:font-bold">
                  <span className="font-bold">Контроль качества</span>
                  <p>
                    Каждая партия продукции проходит строгий контроль, что
                    гарантирует соответствие продукции высоким стандартам
                    качества и надежности.
                  </p>
                </li>
                <li className="marker:font-bold">
                  <span className="font-bold">География деятельности</span>
                  <p>
                    "СКУ-22" осуществляет свою деятельность на внутреннем рынке,
                    обеспечивая стабильные поставки продукции. Благодаря
                    собственным ресурсам и современным технологиям,
                    компания планирует расширять присутствие на внутреннем
                    рынке.
                  </p>
                </li>
                <li className="marker:font-bold">
                  <span className="font-bold">Ценности и миссия</span>
                  <p>
                    Миссия BRUSKA — производить надежную и высококачественную
                    плитку, обеспечивая клиентов продукцией, отвечающей самым
                    высоким стандартам. Компания ценит стабильность поставок,
                    качество продукции и постоянное внедрение инноваций для
                    достижения лучших результатов.
                  </p>
                </li>
              </ol>
            </div>
            <div>
              <Image
                src="/about/scheme.svg"
                className="rounded-none!"
                alt={""}
                width={530}
                height={1072}
              />
            </div>
          </div>
        </section>
        <section className="py-4 md:py-12">
          <Packing />
        </section>
        <section className="py-4 md:py-12">
          <Services />
        </section>
        <section className="grid grid-cols-6 gap-6 pt-4 pb-8 md:pt-12 md:pb-24">
          <div className="col-start-1 col-end-4 aspect-5/4 overflow-hidden object-center rounded-3xl">
            <Image
              src="/about/tech-1.png"
              className="w-full h-full object-cover object-center"
              alt={""}
              width={630}
              height={544}
            />
          </div>
          <div className="col-start-4 flex col-end-7 aspect-5/4 overflow-hidden object-center rounded-3xl">
            <Image
              src="/about/tech-2.png"
              alt={""}
              width={630}
              height={544}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-start-1 col-end-3 aspect-square overflow-hidden object-center rounded-3xl">
            <Image
              src="/about/tech-3.png"
              alt={""}
              width={430}
              height={360}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="col-start-3 col-end-5 aspect-square overflow-hidden object-center rounded-3xl">
            <Image
              src="/about/tech-4.png"
              alt={""}
              width={430}
              height={360}
              className="w-full h-full object-cover object-bottom"
            />
          </div>
          <div className="col-start-5 col-end-7 aspect-square overflow-hidden object-center object-contain rounded-3xl">
            <Image
              src="/about/tech-5.png"
              className="w-full h-full object-cover"
              alt={""}
              width={430}
              height={360}
            />
          </div>
        </section>
      </Container>
    </div>
  );
}
