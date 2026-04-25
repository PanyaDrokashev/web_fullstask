"use client";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";

import Container from "./Container";
import { EmailIcon, MarkerIcon, PhoneIcon, SmartphoneIcon } from "../Icons";
import { useRouter } from "next/navigation";
import PAGES from "@/config/pages";
import { downloadFile } from "@/hooks/downloadFile";
import { IFooterData } from "@/shared/types/content";

export default function Footer({ data }: { data: IFooterData }) {
  const router = useRouter();
  const email = data.contacts.find((item) => item.type === "email");
  const phones = data.contacts.find((item) => item.type === "phone");
  const address = data.contacts.find((item) => item.type === "address");

  return (
    <footer className="bg-darkbg">
      <Container className="grid grid-cols-6 gap-4 gap-y-8 justify-between text-light py-[96px]">
        <div className="col-span-6 md:col-span-2">
          <Image className="rounded-none!" height={75} src="/logo.svg" width={361} />
          <p className="mt-6">{data.description}</p>
          <p className="mt-3 text-[#D4D4D4] text-[14px]">{data.brand}</p>
        </div>

        <div className="col-span-6 xs:col-span-3 md:col-span-2">
          <h3 className="font-bold mb-6">Контакты</h3>
          <ul className="flex flex-col gap-6">
            {email?.value && email.link && (
              <li>
                <Link className="flex gap-1.5 items-start" href={email.link} target="_blank">
                  <EmailIcon height={24} width={24} />
                  {email.value}
                </Link>
              </li>
            )}

            {phones?.values?.length ? (
              <li>
                <div className="flex gap-1.5 items-start">
                  <PhoneIcon height={24} width={24} />
                  <div className="flex flex-col">
                    {phones.values.map((phone) => (
                      <a key={phone} href={`tel:${phone.replace(/\D/g, "")}`}>
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ) : null}

            {address?.value && address.link && (
              <li>
                <Link className="flex gap-1.5 items-start" href={address.link} target="_blank">
                  <MarkerIcon height={24} width={24} />
                  {address.value}
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="col-span-6 xs:col-span-3 md:col-span-2">
          <h3 className="font-bold mb-6">Нужна консультация?</h3>
          <p className="mb-6">
            Оставьте заявку, и наш менеджер
            <br />
            свяжется с вами в ближайшее время
          </p>
          <Button
            className="text-dark font-bold"
            color="primary"
            startContent={<SmartphoneIcon height={16} width={16} />}
            variant="solid"
            onPress={() => router.push(PAGES.CONTACTS)}
          >
            Заказать звонок
          </Button>
        </div>
      </Container>

      <Container className="flex max-xs:flex-col justify-between text-light items-start xs:items-center pb-10">
        <div className="max-xs:mb-2">{data.copyright}</div>
        <div className="flex max-xs:flex-col gap-2 xs:gap-10">
          {data.docs.map((doc) => (
            <Link key={doc.path} className="cursor-pointer" onPress={() => downloadFile(doc.path, doc.file)}>
              {doc.title}
            </Link>
          ))}
        </div>
      </Container>
    </footer>
  );
}
