import { ReactNode } from "react";

interface IContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ className, children }: IContainerProps) {
  return (
    <div className={`max-w-[1320px] m-auto px-5 ${className}`}>{children}</div>
  );
}
