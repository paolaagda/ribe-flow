import { useLocalStorage } from './useLocalStorage';
import { Store, mockStores } from '@/data/mock-data';
import { useCallback } from 'react';

export function useStores() {
  const [stores, setStores] = useLocalStorage<Store[]>('ribercred_stores', mockStores);

  const getStoresByPartnerId = useCallback(
    (partnerId: string) => stores.filter(s => s.partnerId === partnerId),
    [stores]
  );

  return { stores, setStores, getStoresByPartnerId };
}
