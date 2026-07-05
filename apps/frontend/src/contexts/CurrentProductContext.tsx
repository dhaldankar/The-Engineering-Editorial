import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentProduct } from '../services/productsService';
import type { ProductDTO } from '../types/product';

interface CurrentProductContextValue {
  product: ProductDTO | null;
  isLoading: boolean;
  setProductId: (id: string) => void;
}

const CurrentProductContext = createContext<CurrentProductContextValue | undefined>(undefined);

export function CurrentProductProvider({ children }: { children: ReactNode }) {
  const [productId, setProductId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['currentProduct', productId],
    queryFn: getCurrentProduct,
  });

  const value = useMemo<CurrentProductContextValue>(
    () => ({ product: data ?? null, isLoading, setProductId }),
    [data, isLoading],
  );

  return <CurrentProductContext.Provider value={value}>{children}</CurrentProductContext.Provider>;
}

export function useCurrentProduct(): CurrentProductContextValue {
  const context = useContext(CurrentProductContext);
  if (!context) {
    throw new Error('useCurrentProduct must be used within a CurrentProductProvider');
  }
  return context;
}
