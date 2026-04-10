import { useMemo } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { formatCentavos } from '@/lib/currency';

/**
 * Returns the suggested potential value (formatted string) from the most recent
 * visit for the given partner before the given date.
 */
export function useLastVisitPotential(partnerId: string, beforeDate: string): string {
  const { visits } = useVisits();

  return useMemo(() => {
    if (!partnerId) return '';

    const candidates = visits
      .filter(v =>
        v.type === 'visita' &&
        v.partnerId === partnerId &&
        (v.potentialValue || 0) > 0 &&
        (!beforeDate || v.date < beforeDate)
      )
      .sort((a, b) => b.date.localeCompare(a.date));

    if (candidates.length === 0) {
      // Fallback: if no date filter or no results, try without date filter
      if (beforeDate) {
        const fallback = visits
          .filter(v =>
            v.type === 'visita' &&
            v.partnerId === partnerId &&
            (v.potentialValue || 0) > 0
          )
          .sort((a, b) => b.date.localeCompare(a.date));
        return fallback.length > 0 ? formatCentavos(fallback[0].potentialValue!) : '';
      }
      return '';
    }

    return formatCentavos(candidates[0].potentialValue!);
  }, [visits, partnerId, beforeDate]);
}
