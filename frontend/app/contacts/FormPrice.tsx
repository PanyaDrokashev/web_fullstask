'use client';

import Discount from "@/app/catalog/[id]/Discount";
import {CartItem} from "@/store/cartStore";

interface IFormPriceProps {
  totalPrice: number,
  totalPriceWithoutDiscount: number,
  discounts: number,
  items: CartItem[]
}

export default function FormPrice({totalPrice, totalPriceWithoutDiscount, discounts, items}: IFormPriceProps) {
  return <div className="p-4.5 rounded-2xl border-1 border-[#00000010] bg-[#FCFCFC]">
    <div className={"flex justify-between font-semibold text-2xl text-dark"}>
      <span>Итого:</span>
      <span>{totalPrice} ₽</span>
    </div>
    {discounts > 0 && <span
      className={"block text-right line-through text-[#737373] font-sm text-medium"}>{totalPriceWithoutDiscount}₽</span>}
    {items.length > 0 && <>
      <div>
        <div className={"flex items-center justify-between text-sm font-medium text-dark"}>
          <span>Понадобится 5 поддонов:</span>
          <span>≈200,16 / м²</span>
        </div>
        <div className={"flex items-center justify-between text-sm font-medium text-dark"}>
          <span>Общий вес:</span>
          <span>≈5,08 т</span>
        </div>
      </div>
      <div className={"mt-3 bg-white p-4.5 rounded-2xl border-1 border-[#00000010]"}>
        <ul>
          {items.map(item => {
            return <li key={item.item.id}
              className={"flex items-center gap-1 justify-between not-last:border-b-1 not-last:border-b-[#00000010] py-3 first:pt-0 last:pb-0"}>
              <div className={"flex flex-col gap-0.5"}>
                <span>{item.item.title}, {item.color}</span>
                <span>{item.price * ((100 - item.discount)  / 100)} / {item.area} м&sup2;</span>
              </div>
              <Discount className={'shrink-0'} discount={item.discount} area={item.area}/>
            </li>
          })}
        </ul>
      </div>
    </>}

  </div>;
}