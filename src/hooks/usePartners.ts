import { useLocalStorage } from '@/hooks/useLocalStorage';
import { mockPartners, Partner } from '@/data/mock-data';

export function usePartners() {
  const [partners, setPartners] = useLocalStorage<Partner[]>('ribercred_partners', mockPartners);

  const getPartnerById = (id: string) => partners.find(p => p.id === id);

  return { partners, setPartners, getPartnerById };
}
