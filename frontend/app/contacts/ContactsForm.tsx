'use client'

import {useState} from "react";
import {Input} from "@heroui/react";
import {Textarea} from "@heroui/input";
import {Button} from "@heroui/button";
import {useMask} from '@react-input/mask';
import TextBlock from "@/components/ui/TextBlock";
import FormPrice from "@/app/contacts/FormPrice";
import {useCartStore} from "@/store/cartStore";

export default function ContactsForm({price}: { price?: any }) {
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalPriceWithoutDiscount = useCartStore((state) => state.getTotalPriceWithoutDiscount)
  const getDiscounts = useCartStore((state) => state.getDiscounts)
  const {items} = useCartStore()

  const [form, setForm] = useState({
    fio: "",
    phone: "",
    mail: "",
    comment: ""
  })

  const phoneRef = useMask({
    mask: '+7 (___) ___-__-__',
    replacement: {_: /\d/},
  });


  function handleFIOChange(value: string) {
    setForm({
      ...form,
      fio: value
    })
  }

  function handlePhoneChange(value: string) {
    setForm({
      ...form,
      phone: value
    })
  }

  function handleMailChange(value: string) {
    setForm({
      ...form,
      mail: value
    })
  }

  function handleCommentChange(value: string) {
    setForm({
      ...form,
      comment: value
    })
  }

  async function handleSendData() {
    if (form.phone == "" || form.fio == "" || form.mail == "") {
      alert("Пожалуйста, заполните обязательные поля в форме")
      return
    }

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({form: form, products: items}),
    });

    if (res.ok) {
      alert("Сообщение успешно отправлено!")
    } else {
      alert("Произошла ошибка при отправке, попробуйте позже")
    }
  }

  return <TextBlock className="flex-1/2" title="Свяжитесь с нами"
                    subtitle="Менеджер свяжется с вами для уточнения деталей.">
    {price && <FormPrice totalPrice={getTotalPrice()} totalPriceWithoutDiscount={getTotalPriceWithoutDiscount()} discounts={getDiscounts()} items={items} />}
    <form className="flex flex-col gap-4 mt-2">
      <label>
        <span className="mb-1 text-medium font-medium">Имя и фамилия <sup className="text-danger">*</sup></span>
        <Input required value={form.fio} onInput={(e) => handleFIOChange(e.currentTarget.value)} placeholder="ФИО"
               className="border-1 border-[#00000010] rounded-xl bg-[#fafafa]"/>
      </label>
      <label>
        <span className="mb-1 text-medium font-medium">Ваш телефон <sup className="text-danger">*</sup></span>
        <Input ref={phoneRef} required value={form.phone} onInput={(e) => handlePhoneChange(e.currentTarget.value)}
               placeholder="+7 (___) ___-__-__" className="border-1 border-[#00000010] rounded-xl bg-[#fafafa]"/>
      </label>
      <label>
        <span className="mb-1 text-medium font-medium">Ваша почта <sup className="text-danger">*</sup></span>
        <Input required value={form.mail} onInput={(e) => handleMailChange(e.currentTarget.value)} placeholder="name@mail.com"
               className="border-1 border-[#00000010] rounded-xl bg-[#fafafa]"/>
      </label>
      <label>
        <span className="mb-1 text-medium font-medium">Комментарий к заказу</span>
        <Textarea size={"lg"} required value={form.comment} onInput={(e) => handleCommentChange(e.currentTarget.value)}
                  placeholder="Укажите пожелания к заказу"
                  className="border-1 border-[#00000010] rounded-xl bg-[#fafafa]"/>
      </label>
      <Button size={"lg"} className={"text-white h-[68px] font-bold"} onPress={handleSendData} color={"secondary"}>Отправить заявку</Button>
      <span className="text-xs text-[#737373] m-auto">Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных</span>
    </form>
  </TextBlock>
}