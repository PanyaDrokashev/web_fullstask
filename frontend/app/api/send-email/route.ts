import 'dotenv/config';
import {Resend} from "resend";
import {CartItem} from "@/store/cartStore";

function renderProducts(products: CartItem[]) {

  const items = products.map(product => {
    return `Название: ${product.item.title}\nЦвет: ${product.color}\nПлощадь помещения: ${product.area}\nЦена: ${product.price}\nСкидка: ${product.discount}%\nЦена со скидкой: ${product.price * ((100 - product.discount)/100)}\n\n`
  })

  const totalPrice = products.reduce((prev, curr) => prev += (curr.price * ((100 - curr.discount)/100)), 0)

  return `${items}\n\n Итоговая цена: ${totalPrice.toFixed(2)}`
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return Response.json(
        {error: "RESEND_API_KEY is not configured"},
        {status: 500}
      );
    }

    const resend = new Resend(apiKey);
    const { form, products } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'no-reply@resend.dev',
      to: ['M.k@sku-22.ru'],
      subject: `Новая заявка с сайта`,
      text: `ФИО:  ${form.fio}\n\nНомер телефона: ${form.phone}\n\nПочта: ${form.mail}\n\nКомментарий: ${form.comment}\n\n${products.length > 0 ? `Позиции:\n\n${renderProducts(products)}` : ""}`,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
