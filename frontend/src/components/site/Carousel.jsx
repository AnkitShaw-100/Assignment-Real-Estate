import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowButton } from '../ui/Button';

/**
 * Horizontal carousel built on native scrolling + CSS scroll-snap.
 * Native scrolling gives real touch momentum and trackpad gestures (the
 * Apple feel) for free; the arrow buttons just scroll by one "page".
 * Keyboard: the track is focusable and responds to ←/→.
 */
export function useCarousel() {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  return { trackRef, edges, prev: () => scroll(-1), next: () => scroll(1), update };
}

export function CarouselControls({ carousel, label, className }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)} role="group" aria-label={`${label} controls`}>
      <ArrowButton direction="left" active={false} onClick={carousel.prev} disabled={carousel.edges.start} aria-label={`Previous ${label}`} />
      <ArrowButton direction="right" active={!carousel.edges.end} onClick={carousel.next} disabled={carousel.edges.end} aria-label={`Next ${label}`} />
    </div>
  );
}

export function CarouselTrack({ carousel, label, className, children }) {
  return (
    <div
      ref={carousel.trackRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') carousel.next();
        if (e.key === 'ArrowLeft') carousel.prev();
      }}
      className={clsx(
        'scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth',
        // let the track bleed to the screen edge on mobile while staying aligned with the page grid
        '-mx-5 scroll-px-5 px-5 md:-mx-8 md:scroll-px-8 md:px-8 xl:mx-0 xl:scroll-px-0 xl:px-0',
        'rounded-card focus-visible:outline-offset-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CarouselItem({ className, children }) {
  return <div className={clsx('shrink-0 snap-start', className)}>{children}</div>;
}
