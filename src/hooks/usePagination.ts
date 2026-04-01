import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
  scrollToTopRef?: React.RefObject<HTMLElement>;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { pageSize = 9, scrollToTopRef } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const prevItemsLengthRef = useRef(items.length);

  // Reset to page 1 when items change (filter/search applied)
  useEffect(() => {
    if (items.length !== prevItemsLengthRef.current) {
      setCurrentPage(1);
      prevItemsLengthRef.current = items.length;
    }
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Auto-correct if current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
    if (scrollToTopRef?.current) {
      scrollToTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages, scrollToTopRef]);

  const showPagination = items.length > pageSize;

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    showPagination,
    totalItems: items.length,
  };
}
