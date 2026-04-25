"use client";

import Slider from "@/components/ui/Slider";
import { ICatalogColors, ICatalogItem } from "@/shared/types/content";
import {Button} from "@heroui/button";
import ColorItem from "./ColorItem";
import {useEffect, useState} from "react";
import {Tab, Tabs} from "@heroui/tabs";
import {Input} from "@heroui/react";
import SectionTitle from "@/components/ui/SectionTitle";
import {Separator} from "@/components/ui/Separator";
import Discount from "@/app/catalog/[id]/Discount";
import {useCartStore} from "@/store/cartStore";
import {useRouter} from "next/navigation";
import {downloadFile} from "@/hooks/downloadFile";
import { getCatalogColorPreviewMap, getCatalogColorPreviewUrl } from "@/shared/api/catalog-assets";

interface IProductInfoProps {
  product: ICatalogItem;
}

function InfoTitle({text}: { text: string }) {
  return <p className="mb-2">{text}</p>;
}

export default function ProductInfo({product}: IProductInfoProps) {
  const [currentColor, setCurrentColor] = useState(product.colors[0]);
  const [colorPreviewMap, setColorPreviewMap] = useState<Record<string, string>>({});
  const [area, setArea] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const router = useRouter()

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let canceled = false;
    const loadColorPreviews = async () => {
      try {
        const map = await getCatalogColorPreviewMap(
          product.dir,
          product.colors.map((c) => c.tag),
        );
        if (!canceled) {
          setColorPreviewMap(map);
        }
      } catch {
        if (!canceled) {
          setColorPreviewMap({});
        }
      }
    };

    void loadColorPreviews();
    return () => {
      canceled = true;
    };
  }, [product.dir, product.colors]);

  function handleColorChange(value: ICatalogColors) {
    setCurrentColor((prevValue) => (prevValue = value));
  }

  const handleDownload = () => downloadFile('/files/catalog.pdf', "Каталог продукции Bruska.pdf")

  function handleAreaInput(value: number) {
    let v = value.toString();
    if (!v.match(/^\d*$/g)) {
      return;
    }

    setArea((prev) => (prev = value));
    if (value < 100) {
      setDiscount(0);
      setCurrentPrice(product.price[currentColor.tag] * value);
    } else if (100 <= value && value < 200) {
      setDiscount(5);
      setCurrentPrice(product.price[currentColor.tag] * value);
    } else if (200 <= value && value < 300) {
      setDiscount(8);
      setCurrentPrice(product.price[currentColor.tag] * value);
    } else {
      setDiscount(12);
      setCurrentPrice(product.price[currentColor.tag] * value);
    }
  }

  function handleAddItem({item, price, area, discount, color}: {item: ICatalogItem, price: number, area: number, discount: number, color: string}) {
    if (area == 0) {
      alert("Введите площадь помещения!")
      return
    }

    addItem({discount, area, price, item, color})
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
        <div className="md:col-span-5 pt-4">
          <Slider sliderHeight={'h-130'} imagesDir={`/catalog/${product.dir}`}/>
        </div>
        <div className="md:col-start-6 md:col-end-9 grow-0 shrink-0 flex-[540px]">
          <div className="bg-white shadow rounded-3xl p-7">
            <form id={'product-form'}>
              <div className="flex justify-between mb-2">
                {product.tag && (
                  <span className="text-dark font-medium">{product.tag}</span>
                )}
                <span className="text-[#737373] font-medium">
                {product.isAvailable ? "В наличии" : "Нет в наличии"}
              </span>
              </div>
              <div className="text-2xl text-dark font-semibold leading-snug">
                {product.title}
              </div>
              <div>
              <span className="text-dark font-medium">
                {product.price[currentColor.tag]}₽
              </span>
                <span className="text-[#737373] font-medium">
                / {product.priceTag}
              </span>
              </div>
              <Separator className="my-6"/>
              <div className="grid gap-1 grid-cols-3 xs:grid-cols-4 pb-1 overflow-scroll">
                {product.colors.map((color, idx) => {
                  return (
                    <ColorItem
                      onChange={() => handleColorChange(color)}
                      key={color.tag}
                      tag={color.tag}
                      preview={colorPreviewMap[color.tag] ?? getCatalogColorPreviewUrl(product.dir, color.tag)}
                      isActive={currentColor === color}
                    />
                  );
                })}
              </div>
              <div className="mt-4">
                <InfoTitle text={"Размер"}/>
                <Tabs fullWidth>
                  {product.sizes.map((size) => (
                    <Tab
                      key={`${size.length}${size.width}${size.height}`}
                      title={`${size.length}x${size.width}x${size.height}`}
                    ></Tab>
                  ))}
                </Tabs>
              </div>
              <div className="mt-4">
                <InfoTitle text="Площадь помещения"/>
                <div className="relative">
                  <Input
                    className="border-1 border-[#00000010] rounded-xl"
                    type="text"
                    value={area == 0 ? "" : area.toString()}
                    required
                    name="area"
                    onInput={(e) => handleAreaInput(Number(e.currentTarget.value))}
                    isClearable
                    onClear={() => handleAreaInput(0)}
                    placeholder="м&sup2;"
                  />
                </div>
              </div>
              <div className="p-[18px] rounded-2xl border-1 border-[#00000010] bg-[#FCFCFC] mt-6">
                <div className="flex items-center justify-between">
                  <div>
                  <span className="text-2xl font-semibold text-dark">
                    {(currentPrice * (100 - discount) / 100).toFixed(0)} ₽
                  </span>
                    <span className="text-gray-400 font-medium">
                    / {area ? area : 0} м&sup2;
                  </span>
                  </div>
                  <Discount discount={discount} area={area} needTip/>
                </div>
                <div className="mt-3 text-[#737373]">
                  <p>
                    <span>5 поддонов </span>
                    <span className="font-bold">≈100,8м&sup2;</span>
                  </p>
                  <p>
                    <span>Общий вес: </span>
                    <span className="font-bold">2,64т</span>
                  </p>
                  <p>
                    <span>Количество плиток: </span>
                    <span className="font-bold">540шт</span>
                  </p>
                </div>
              </div>
            </form>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <Button form={'product-form'}
                    onPress={() => handleAddItem({item: product, price: currentPrice, area: area, discount: discount, color: currentColor.tag})}
                    className="text-white"
                    color="secondary">
              Добавить в корзину
            </Button>
            <Button
              className="text-dark border-1 border-[#00000010]"
              color="primary"
              variant="solid"
              onPress={() => router.push('/contacts')}
            >
              Заказать образец
            </Button>
          </div>
        </div>
      </div>
      <div className={"hidden md:block"}>
        <Separator className="my-12"/>
        <SectionTitle text="О плитке" className="mb-7"/>
        <div className="py-8 px-5  bg-white shadow border-1 border-[#00000010] rounded-3xl">
          <div className="mb-4 flex flex-col gap-2">
            {(product.description ?? []).map((t, id) => (
              <p key={id}>{t}</p>
            ))}
          </div>
          <Button
            className="text-dark border-1 self-start  border-[#00000010]"
            color="primary"
            size="lg"
            variant="solid"
            onPress={handleDownload}
          >
            Весь каталог в PDF
          </Button>
        </div>
      </div>
    </>
  );
}
