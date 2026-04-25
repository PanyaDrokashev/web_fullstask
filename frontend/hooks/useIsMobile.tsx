"use client";

import { useEffect, useState } from "react";

export function useIsMobile(maxWidth: number = 767) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    checkWidth();

    window.addEventListener("resize", checkWidth);

    return () => window.removeEventListener("resize", checkWidth);
  }, [maxWidth]);

  return isMobile;
}
