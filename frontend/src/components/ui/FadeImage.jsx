import { useCallback, useState } from 'react';
import clsx from 'clsx';

/**
 * Image that shows a skeleton shimmer until it has loaded, then fades in
 * in place (no movement). The wrapper takes the size; pass layout classes
 * via `className` (e.g. "absolute inset-0" or "aspect-[4/3]").
 */
export function FadeImage({ className, imgClassName, alt = '', ...props }) {
  const [loaded, setLoaded] = useState(false);
  // Cached images can finish before React attaches onLoad
  const ref = useCallback((img) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <span className={clsx('block overflow-hidden', !loaded && 'skeleton', className)}>
      <img
        ref={ref}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={clsx('size-full object-cover transition-opacity duration-500 ease-out-soft', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
        {...props}
      />
    </span>
  );
}
