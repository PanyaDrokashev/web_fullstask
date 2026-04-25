'use client';

import {Button} from "@heroui/button";

import {IIconProps} from "../../Icons";
// import { Link } from "@heroui/link";
import {useRouter} from "next/navigation";
import {func} from "prop-types";

interface IHeaderItemProps {
  label: string;
  href: string;
  Icon?: React.ComponentType<IIconProps>;
  className?: string;
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost"
    | undefined;
  fn?: () => void
}

export const HeaderItem = ({
                             label,
                             href,
                             Icon,
                             className,
                             variant,
                             fn
                           }: IHeaderItemProps) => {
  const router = useRouter();

  function handleMenuItemPress(handleMenuClose: (() => void) | undefined, href: string) {
    router.push(href)
    if (handleMenuClose) {
      handleMenuClose()
    }
  }

  return (
    <Button
      className={`md:text-black md:bg-primary xs:text-white xs:bg-transparent ${className}`}
      startContent={Icon && <Icon height={16} width={16}/>}
      variant={variant ? variant : "solid"}
      onPress={() => handleMenuItemPress(fn, href)}
    >
      {label}
    </Button>
  );
};
