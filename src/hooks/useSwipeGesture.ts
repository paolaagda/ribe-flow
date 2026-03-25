import { useRef, useCallback, TouchEvent } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeConfig {
  threshold?: number;
  maxAngle?: number;
  onSwipe: (direction: SwipeDirection) => void;
}

function hasHorizontalScroll(el: HTMLElement | null): boolean {
  while (el) {
    if (el.scrollWidth > el.clientWidth) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function useSwipeGesture({ threshold = 50, maxAngle = 30, onSwipe }: SwipeConfig) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const firedRef = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    firedRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!startRef.current || firedRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const dist = Math.sqrt(absDx * absDx + absDy * absDy);

    if (dist < threshold) return;

    const angleDeg = (Math.atan2(Math.min(absDx, absDy), Math.max(absDx, absDy)) * 180) / Math.PI;
    if (angleDeg > maxAngle) return;

    let direction: SwipeDirection;
    if (absDx > absDy) {
      if (hasHorizontalScroll(e.target as HTMLElement)) return;
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    firedRef.current = true;
    onSwipe(direction);
  }, [threshold, maxAngle, onSwipe]);

  const onTouchEnd = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
