"use client";

import {useEffect, useRef, useState} from "react";
import type {Swiper as SwiperType} from "swiper";
import {Swiper, SwiperSlide} from 'swiper/react';
import {Controller, FreeMode, Navigation, Thumbs} from 'swiper/modules';
import 'swiper/css';

import {Button} from "@heroui/button";

import {ShevronIcon} from "@/components/Icons";
import {Image} from "@heroui/image";

export const Thumb = (props: {
  selected: boolean;
  img: string;
  onClick: () => void;
  index: number;
}) => {
  const {selected, img} = props;

  return (
    <button
      className={`w-24 h-24 rounded-3xl border-2 overflow-hidden transition-all ${selected ? " border-black" : "border-transparent"}`}
      type="button"
      onClick={props.onClick}
      data-index={props.index}
    >
      <img
        alt="slider image"
        className="w-24 h-24 rounded-3xl! object-cover object-center"
        src={`${img}`}
      />
    </button>
  );
};


export default function Slider({imagesDir, sliderHeight}: { imagesDir: string, sliderHeight: string }) {
  const [slides, setSlides] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToActiveThumb = () => {
    if (!thumbsContainerRef.current) return;

    const container = thumbsContainerRef.current;
    const activeThumb = container.querySelector(`button[data-index="${activeIndex}"]`) as HTMLElement;

    if (!activeThumb) return;

    if (container.scrollWidth <= container.clientWidth) return;

    const thumbLeft = activeThumb.offsetLeft;
    const thumbWidth = activeThumb.offsetWidth;
    const containerWidth = container.clientWidth;

    const targetScroll = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch(`/api/slides?dir=${encodeURIComponent(imagesDir)}`);
        if (!res.ok) throw new Error("Failed to fetch slides");
        const data = await res.json();
        setSlides(data);
      } catch (err) {
        setError("Error loading slides");
      } finally {
        setLoading(false);
      }
    }

    fetchSlides();
  }, [imagesDir]);

  useEffect(() => {
    scrollToActiveThumb();
  }, [activeIndex]);

  if (loading) return <div className="h-96 flex items-center justify-center">Загрузка изображений...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (slides.length === 0) return <div>Ошибка загрузки изображений</div>;


  return (
    <div className={`w-full`}>
      <Swiper
        loop={true}
        modules={[Navigation, Thumbs, Controller]}
        thumbs={{swiper: thumbsSwiper}}
        navigation={{
          prevEl: ".swiper-prev",
          nextEl: ".swiper-next",
        }}
        className={`relative w-full rounded-xl overflow-hidden`}
        onSwiper={setMainSwiper}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {slides.map((img, idx) => (
          <SwiperSlide key={idx}>
            <div className={`w-full ${sliderHeight} max-md:h-80`}>
              <img
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-center object-cover"
                height={"100%"}
                width={"full"}
                loading="lazy"
                src={img}
              />
            </div>
          </SwiperSlide>
        ))}

        <Button
          isIconOnly
          className="swiper-prev absolute left-4 top-1/2 -translate-y-1/2 z-10"
          color="primary"
        >
          <ShevronIcon height={16} width={16}/>
        </Button>
        <Button
          isIconOnly
          className="swiper-next absolute right-4 top-1/2 -translate-y-1/2 z-10"
          color="primary"
        >
          <div className="rotate-180">
            <ShevronIcon height={16} width={16}/>
          </div>
        </Button>
      </Swiper>

      <div className="mt-6">
        <div className="overflow-x-auto scrollbar-hide" ref={thumbsContainerRef}>
          <div className="flex gap-4 justify-center items-center min-w-max">
            {slides.map((img, index) => (
              <Thumb
                key={index}
                img={img}
                selected={index === activeIndex}
                onClick={() => mainSwiper?.slideToLoop(index)}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}