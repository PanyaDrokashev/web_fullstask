'use client';

import {DiscountIcon} from "@/components/Icons";
import {useState} from "react";

const DISCOUNTS = [5, 8, 12];

function DiscountTip({
                       currentArea,
                       className,
                       isVisible,
                     }: {
  currentArea: number;
  className: string;
  isVisible: boolean;
}) {
  const meters = Math.floor(currentArea / 100);

  return (
    <div
      className={
        className +
        `${isVisible ? " opacity-100 visible " : " opacity-0 invisible "}`
      }
    >
      {meters <= 2 ? (
        <h4 className="text-green-950 text-sm">
          Еще{" "}
          <span className="font-bold">{100 - (currentArea % 100)} м&sup2;</span>{" "}
          до скидки в {DISCOUNTS[meters]}%:
        </h4>
      ) : (
        <h4 className="text-green-950 text-sm">
          Вы получили максимальную скидку!
        </h4>
      )}

      <ul className="mt-2">
        <li className="text-xs font-bold ">от 100м&sup2; — 5%</li>
        <li className="text-xs font-bold ">от 200м&sup2; — 8%</li>
        <li className="text-xs font-bold ">от 300м&sup2; — 12%</li>
      </ul>
    </div>
  );
}


export default function Discount({className, discount, area, needTip = false} : {
  className?: string,
  discount: number,
  area: number,
  needTip?: boolean
}) {
  const [showDiscountTip, setShowDiscountTip] = useState(false);

  return <div
    className={`${className} flex items-center relative gap-1.5 py-1.5 px-2 rounded-lg ${discount == 0 ? "bg-gray-200" : "bg-emerald-100"}`}
  >
    <div
      onMouseEnter={() => needTip && setShowDiscountTip(true)}
      onMouseLeave={() => needTip && setShowDiscountTip(false)}
    >
      <DiscountIcon
        width={20}
        height={20}
        fill={discount == 0 ? "bg-gray-500" : "#016630"}
      />
    </div>
    {discount == 0 ? (
      <span className="">Без скидки</span>
    ) : (
      <span className="text-green-800">Скидка {discount}%</span>
    )}

    <DiscountTip
      className="absolute shadow duration-100 bottom-12 py-4 px-6 w-[285px] rounded-xl bg-green-50 right-0"
      currentArea={area}
      isVisible={showDiscountTip}
    />
  </div>
}