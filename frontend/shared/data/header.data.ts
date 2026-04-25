import PAGES from "@/config/pages";
import {
  IIconProps,
  ShoppingBasketIcon,
  ShoppingIcon,
} from "@/components/Icons";

export interface INavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<IIconProps>;
}

export const NAVITEMS: INavItem[] = [
  {
    label: "Все товары",
    href: PAGES.CATALOG,
    icon: ShoppingIcon,
  },
  {
    label: "О компании",
    href: PAGES.ABOUT,
  },
  {
    label: "Контакты",
    href: PAGES.CONTACTS,
  },
  {
    label: "Корзина",
    href: PAGES.CART,
    icon: ShoppingBasketIcon,
  },
];
