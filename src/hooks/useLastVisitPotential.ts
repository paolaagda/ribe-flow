import { useMemo } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { formatCentavos } from '@/lib/currency';
import { format } from 'date-fns';

interface LastVisitPotentialResult {
  value: string;
  sourceDate: string; // formatted date string for display, e.g. "15/03/2026"
}

/**
 * Returns the suggested potential value (formatted string) and the source visit date
 * from the most recent visit with a filled potential for the given partner before the given date.
 */
export function useLastVisitPotential(partnerId: string, beforeDate: string): LastVisitPotentialResult {
  const { visits } = useVisits();

  return useMemo(() => {
    const empty: LastVisitPotentialResult = { value: '', sourceDate: '' };
    if (!partnerId) return empty;

    // Get all visits for this partner sorted by date descending
    const sorted = visits
      .filter(v =>
        v.type === 'visita' &&
        v.partnerId === partnerId &&
        (!beforeDate || v.date < beforeDate)
      )
      .sort((a, b) => b.date.localeCompare(a.date));

    // Find the first one with potentialValue filled
    const match = sorted.find(v => (v.potentialValue || 0) > 0);

    if (match) {
      const [y, m, d] = match.date.split('-');
      const displayDate = `${d}/${m}/${y}`;
      return { value: formatCentavos(match.potentialValue!), sourceDate: displayDate };
    }

    // Fallback: if beforeDate was set but no results, try without date filter
    if (beforeDate) {
      const allSorted = visits
        .filter(v =>
          v.type === 'visita' &&
          v.partnerId === partnerId
        )
        .sort((a, b) => b.date.localeCompare(a.date));

      const fallbackMatch = allSorted.find(v => (v.potentialValue || 0) > 0);
      if (fallbackMatch) {
        const [y, m, d] = fallbackMatch.date.split('-');
        const displayDate = `${d}/${m}/${y}`;
        return { value: formatCentavos(fallbackMatch.potentialValue!), sourceDate: displayDate };
      }
    }

    return empty;
  }, [visits, partnerId, beforeDate]);
}
