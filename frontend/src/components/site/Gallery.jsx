import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Images, X } from '../ui/icons';
import { imageUrl } from '../../lib/format';
import { FadeImage } from '../ui/FadeImage';
import { spring } from '../../lib/motion';

/**
 * Detail page gallery: one large photo (shares its layoutId with the listing
 * card so it morphs in from the grid) plus two smaller ones; any photo opens
 * the fullscreen lightbox.
 */
export function Gallery({ property }) {
  const images = property.images ?? [];
  const coverIndex = property.coverIndex ?? 0;
  const ordered = [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)].filter(Boolean);
  const [openAt, setOpenAt] = useState(null);

  if (!ordered.length) return <div className="aspect-[16/9] rounded-panel bg-mist-100" />;

  return (
    <>
      {/* Fixed height on desktop so tall or wide source photos all crop to the same frame */}
      <div className="grid gap-3 md:h-[540px] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-2">
        <button type="button" onClick={() => setOpenAt(0)} className="group relative block overflow-hidden rounded-panel md:row-span-2 md:h-full" aria-label="Open photo 1 in full screen">
          <FadeImage
            className="aspect-[4/3] w-full md:absolute md:inset-0 md:aspect-auto md:h-full"
            src={imageUrl(ordered[0].url, 1600)}
            srcSet={`${imageUrl(ordered[0].url, 900)} 900w, ${imageUrl(ordered[0].url, 1600)} 1600w, ${imageUrl(ordered[0].url, 2200)} 2200w`}
            sizes="(min-width: 768px) 66vw, 100vw"
            alt={ordered[0].alt ?? property.title}
            loading="eager"
            fetchPriority="high"
          />
        </button>
        {ordered.slice(1, 3).map((img, i) => (
          <button key={img.url} type="button" onClick={() => setOpenAt(i + 1)} className="group relative hidden overflow-hidden rounded-panel md:block md:h-full" aria-label={`Open photo ${i + 2} in full screen`}>
            <FadeImage className="absolute inset-0" src={imageUrl(img.url, 800)} alt={img.alt ?? ''} />
            {i === 1 && ordered.length > 3 && (
              <span className="glass absolute right-4 bottom-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-float">
                <Images className="size-4" strokeWidth={1.5} />
                Show all {ordered.length} photos
              </span>
            )}
          </button>
        ))}
      </div>
      {ordered.length > 1 && (
        <button type="button" onClick={() => setOpenAt(0)} className="mt-3 flex items-center gap-2 text-sm font-medium md:hidden">
          <Images className="size-4" strokeWidth={1.5} />
          Show all {ordered.length} photos
        </button>
      )}
      <Lightbox images={ordered} index={openAt} onIndex={setOpenAt} title={property.title} />
    </>
  );
}

function Lightbox({ images, index, onIndex, title }) {
  const open = index !== null;
  const [direction, setDirection] = useState(1);
  const go = useCallback(
    (step) => {
      setDirection(step);
      onIndex((i) => (i + step + images.length) % images.length);
    },
    [images.length, onIndex],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onIndex(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, go, onIndex]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          className="fixed inset-0 z-50 flex flex-col bg-navy-900/96 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-white/70 tabular" aria-live="polite">
              {index + 1} / {images.length}
            </p>
            <button type="button" onClick={() => onIndex(null)} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close photos" autoFocus>
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={images[index].url}
                src={imageUrl(images[index].url, 2200)}
                alt={images[index].alt ?? ''}
                custom={direction}
                variants={{
                  enter: (d) => ({ x: d * 80, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d) => ({ x: d * -80, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={spring.soft}
                // Swipe on touch: drag far or fast enough to change photo
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 || info.velocity.x < -400) go(1);
                  else if (info.offset.x > 80 || info.velocity.x > 400) go(-1);
                }}
                className="max-h-full max-w-full cursor-grab touch-pan-y rounded-card object-contain select-none active:cursor-grabbing"
                draggable={false}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="glass absolute left-4 grid size-12 place-items-center rounded-full text-navy-900 max-sm:hidden" aria-label="Previous photo">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="glass absolute right-4 grid size-12 place-items-center rounded-full text-navy-900 max-sm:hidden" aria-label="Next photo">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
