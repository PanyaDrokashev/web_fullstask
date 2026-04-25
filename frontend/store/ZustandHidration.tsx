'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export function ZustandHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  return null;
}