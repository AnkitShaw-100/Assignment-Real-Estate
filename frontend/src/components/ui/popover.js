import { useCallback, useLayoutEffect, useState } from 'react';

const MAX_HEIGHT = 288;

/**
 * Fixed-position coordinates for a popover under (or, near the bottom of the
 * viewport, above) `anchorRef`. Follows the anchor on scroll and resize while
 * open. Rendering through a portal with these keeps the popover from being
 * clipped by drawers and overflow containers.
 */
export function useAnchoredPosition(anchorRef, open, estimatedHeight = MAX_HEIGHT) {
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const up = below < Math.min(MAX_HEIGHT, estimatedHeight) && above > below;
    setPos({
      left: r.left,
      width: r.width,
      up,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.min(MAX_HEIGHT, (up ? above : below) - 6),
    });
  }, [anchorRef, estimatedHeight]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  return pos;
}

/** Calls onDismiss on a pointer press outside every element in `refs`. */
export function useDismiss(open, refs, onDismiss) {
  useLayoutEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!refs.some((r) => r.current?.contains(e.target))) onDismiss();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  });
}

/** Shared look for popover panels and their rows. */
export const panelClass = 'fixed z-[60] min-w-40 overflow-y-auto overscroll-contain rounded-card border border-line bg-paper p-1.5 shadow-lift';
export const panelMotion = (up) => ({
  initial: { opacity: 0, y: up ? 4 : -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
});
export const panelStyle = (pos) => ({
  left: pos.left,
  width: pos.width,
  top: pos.top,
  bottom: pos.bottom,
  maxHeight: pos.maxHeight,
  transformOrigin: pos.up ? 'bottom' : 'top',
});
