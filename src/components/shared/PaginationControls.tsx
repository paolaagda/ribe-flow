import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({ currentPage, totalPages, totalItems, onPageChange }: PaginationControlsProps) {
  const isMobile = useIsMobile();

  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-ds-md">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {!isMobile && 'Anterior'}
      </Button>

      {isMobile ? (
        <span className="text-xs text-muted-foreground tabular-nums px-2">
          Página {currentPage} de {totalPages}
        </span>
      ) : (
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`e${i}`} className="w-8 text-center text-muted-foreground text-xs">…</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-8 w-8 p-0 text-xs', page === currentPage && 'pointer-events-none')}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {!isMobile && 'Próximo'}
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
