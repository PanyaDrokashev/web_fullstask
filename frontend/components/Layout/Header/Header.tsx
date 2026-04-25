"use client";

import { Link } from "@heroui/link";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";

import Container from "../Container";
import {
  BurgerIcon,
  CloseIcon,
  IIconProps,
  Logo,
  ShoppingBasketIcon,
  ShoppingIcon,
} from "../../Icons";

import { HeaderItem } from "./HeaderItem";

import PAGES from "@/config/pages";
import { useCartStore } from "@/store/cartStore";
import { INavItem } from "@/shared/types/content";

interface IHeaderProps {
  navItems: INavItem[];
  isAuthorized?: boolean;
}

const iconMap: Record<
  Exclude<INavItem["icon"], null>,
  React.ComponentType<IIconProps>
> = {
  shopping: ShoppingIcon,
  "shopping-basket": ShoppingBasketIcon,
};

export default function Header({
  navItems,
  isAuthorized = false,
}: IHeaderProps) {
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());

  const toggleMenu = () => setIsMenuOpened((prev) => !prev);

  const navWithIcons = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        icon: item.icon ? iconMap[item.icon] : undefined,
      })),
    [navItems],
  );

  const cartHref = PAGES.CART;

  return (
    <header className="bg-[#22201E] relative z-10" suppressHydrationWarning>
      <Container className="py-6 flex items-center justify-between gap-3">
        <div className="flex md:gap-6 gap-0 max-md:w-full justify-between">
          <Link href={PAGES.HOME}>
            <Logo height={32} width={155} />
          </Link>
          <div className="flex gap-0 xs:gap-4">
            <HeaderItem
              Icon={ShoppingBasketIcon}
              className="flex s:hidden border-none! text-white! hover:text-dark bg-transparent!"
              href={PAGES.CART}
              label={`${Math.round(getTotalPrice)}₽`}
              variant="ghost"
            />
            <Button
              isIconOnly
              className="flex s:hidden relative z-10"
              color="primary"
              onPress={toggleMenu}
            >
              {!isMenuOpened ? (
                <BurgerIcon height={16} width={16} />
              ) : (
                <CloseIcon height={16} width={16} />
              )}
            </Button>
          </div>
          <div className="s:block hidden">
            {navWithIcons.map((navItem, idx) =>
              idx < 1 ? (
                <HeaderItem
                  key={navItem.href}
                  Icon={navItem.icon}
                  href={navItem.href}
                  label={navItem.label}
                />
              ) : null,
            )}
          </div>
        </div>

        <div className="s:flex md:gap-4 gap-0 hidden items-center">
          {navWithIcons.map((navItem, idx) => {
            if (idx < 1) {
              return null;
            }

            const isCart = navItem.href === cartHref;

            return (
              <HeaderItem
                key={navItem.href}
                Icon={navItem.icon}
                className={
                  isCart
                    ? "border-none! hover:text-dark! text-white! bg-transparent!"
                    : undefined
                }
                href={navItem.href}
                label={
                  isCart
                    ? `${navItem.label}: ${Math.round(getTotalPrice)}₽`
                    : navItem.label
                }
                variant={isCart ? "ghost" : undefined}
              />
            );
          })}
          {!isAuthorized ? (
            <HeaderItem
              href={PAGES.LOGIN}
              label="Войти"
              className="border-none! hover:text-dark! text-white! bg-transparent!"
              variant="ghost"
            />
          ) : null}
        </div>

        <div
          className={`absolute duration-200 bg-[#22201e] left-0 right-0 p-8 ${isMenuOpened ? "translate-y-[0] top-[88px]" : "translate-y-[-100%] -top-100"}`}
        >
          <div className="flex flex-col gap-4">
            {navWithIcons.map((item, idx) => {
              if (idx === 0) {
                return (
                  <HeaderItem
                    key={item.href}
                    Icon={item.icon}
                    href={item.href}
                    label={item.label}
                    variant="solid"
                    className="bg-[#BF7D4D]! text-white!"
                    fn={() => setIsMenuOpened(false)}
                  />
                );
              }

              if (idx < 3) {
                return (
                  <HeaderItem
                    key={item.href}
                    Icon={item.icon}
                    href={item.href}
                    label={item.label}
                    variant="solid"
                    className="bg-[#fafafa]! text-dark!"
                    fn={() => setIsMenuOpened(false)}
                  />
                );
              }

              return null;
            })}
            {!isAuthorized ? (
              <HeaderItem
                href={PAGES.LOGIN}
                label="Login"
                variant="solid"
                className="bg-[#fafafa]! text-dark!"
                fn={() => setIsMenuOpened(false)}
              />
            ) : null}
          </div>
        </div>
      </Container>
    </header>
  );
}
