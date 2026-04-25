'use client';

import ContactsForm from "@/app/contacts/ContactsForm";
import Container from "@/components/Layout/Container";
import {Image} from "@heroui/image";
import {Button} from "@heroui/button";
import {useRouter} from "next/navigation";

import {useCartStore} from '@/store/cartStore';
import { getCatalogCardImageUrl } from "@/shared/api/catalog-assets";

function CartItem({id, img, tag, color, name, price, area}: {
  id: number,
  img: string,
  tag: string,
  color: string,
  name: string,
  price: number,
  area: number
}) {
  const removeItem = useCartStore((state) => state.removeItem);
  const router = useRouter()

  return <div className={"p-6 bg-white rounded-2xl flex gap-6"}>
    <div>
      <Image className={'max-w-full'} width={136} height={136} src={img}/>
    </div>
    <div className={'flex flex-col gap-2 flex-auto'}>
      <div className={'text-sm font-medium text-dark'}>
        <div>{tag}, {color}</div>
      </div>
      <div className={'flex justify-between'}>
        <div className={'font-semibold text-2xl text-dark'}>
          <div>{name}</div>
          <div>{price}₽ <span className={'font-medium text-[#737373] text-[16px]'}>/ {area}м&sup2;</span></div>
        </div>
        <div className={'flex flex-col justify-between items-end text-[#737373] text-sm'}>
          <div>
            <span>5 поддонов </span>
            <span className={'font-bold'}>≈100,08 м²</span>
          </div>
          <div>
            <span>Общий вес: </span>
            <span className={'font-bold'}>2,64 т</span>
          </div>
          <div>
            <span>Количество плиток: </span>
            <span className={'font-bold'}>540 шт.</span>
          </div>
        </div>
      </div>
      <div className={'grid grid-cols-2 gap-3'}>
        <Button color={'primary'} className={'border-1 border-[#00000010]'} onPress={() => router.push(`/catalog/${id}`)}>Редактировать</Button>
        <Button onPress={() => removeItem(id)} color={'primary'} className={'border-1 border-[#00000010]'}>Удалить
          товар</Button>
      </div>
    </div>
  </div>
}

export default function CartPage() {
  const {items} = useCartStore()


  return <section className={"py-12"}>
    <Container className={"grid grid-cols-1 md:grid-cols-5 gap-8"}>
      <div className={'md:col-span-3 flex flex-col gap-6'}>
        {items.length > 0 ?
          items.map(item => {
            return <CartItem key={item.item.id} id={item.item.id} img={getCatalogCardImageUrl(item.item.dir, item.item.img, item.color || item.item.colors[0]?.tag)} tag={item.item.tag!}
                             color={item.color} name={item.item.title}
                             price={item.price * ((100 - item.discount) / 100)} area={item.area}/>
          }) : <p className={'text-center py-8'}>Ваша корзина пустая — пора обновиться!</p>}
      </div>
      <div className={"md:col-start-4 md:col-end-6"}>
        <ContactsForm price/>
      </div>
    </Container>
  </section>
}
