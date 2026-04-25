import Container from "@/components/Layout/Container";
import TextBlock from "@/components/ui/TextBlock";
import { Image } from "@heroui/image";
import { TG, VK } from "@/components/Icons";
import ContactsForm from "@/app/contacts/ContactsForm";

export async function generateMetadata() {
  return {
    title: "Связаться с нами",
    description: "Контакты для связи с менеджерами компании",
  };
}

export default function ContactsPage() {
  return (
    <section className="py-12 md:py-24">
      <Container className="flex max-xs:flex-col gap-4 md:gap-x-12 items-start">
        <div className="flex flex-col gap-6 flex-1/2">
          <TextBlock title={"Наши контакты"}>
            <ul className="flex flex-col gap-6">
              <li className="flex flex-col gap-2">
                <span className="flex gap-1 items-center">
                  <Image src="/contacts/map-pin.svg" width={24} height={24} />
                  <span className={"font-bold"}>Адрес</span>
                </span>
                <div className={"pl-7"}>
                  <a href="">г. Самара, ул.22 Партсъезда, 2а к.4</a>
                </div>
              </li>
              <li className="flex flex-col gap-2">
                <span className="flex gap-1 items-center">
                  <Image src="/contacts/handset.svg" width={24} height={24} />
                  <span className={"font-bold"}>Телефон</span>
                </span>
                <div className={"pl-7 flex flex-col gap-2"}>
                  <a href="tel:79277301601">+7 (927) 730-16-01</a>
                  <a href="tel:79198103777">+7 (919) 810-37-77</a>
                </div>
              </li>
              <li className="flex flex-col gap-2">
                <span className="flex gap-1 items-center">
                  <Image src="/contacts/envelope.svg" width={24} height={24} />
                  <span className={"font-bold"}>Email</span>
                </span>
                <div className={"pl-7"}>
                  <a href="mailto:M.k@sku-22.ru">M.k@sku-22.ru</a>
                </div>
              </li>
            </ul>
            <div className="flex gap-2 mt-4">
              <a
                href="https://t.me/bruska163"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TG width={36} height={36} />
              </a>
              <a
                href="https://vk.com/bruska63"
                target="_blank"
                rel="noopener noreferrer"
              >
                <VK width={36} height={36} />
              </a>
            </div>
          </TextBlock>
          <TextBlock className="">
            <div>
              <h3 className="font-bold leading-5 text-[18px]">
                Производственное подразделение
              </h3>
              <span className="text-xs text-[#737373]">
                Bruska является производственным подразделением группы компаний
                СКУ-22.
              </span>
            </div>
          </TextBlock>
        </div>
        <ContactsForm />
      </Container>
    </section>
  );
}
