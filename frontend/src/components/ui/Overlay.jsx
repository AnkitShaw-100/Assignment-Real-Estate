import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from './icons';
import clsx from 'clsx';
import { spring } from '../../lib/motion';

/** Locks page scroll, closes on Escape, and returns focus to the trigger when closed. */
function useOverlayBehaviour(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // Keep Tab inside the panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll('a[href],button:not([disabled]),input,select:not([tabindex="-1"]),textarea,[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => panelRef.current?.querySelector('[data-autofocus]')?.focus() ?? panelRef.current?.focus());

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

function Backdrop({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-navy-900/32 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      aria-hidden
    />
  );
}

function Header({ title, description, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
      <div>
        <h2 className="font-display text-h3">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <button type="button" onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-full text-slate-500 hover:bg-mist-100 hover:text-navy-900" aria-label="Close">
        <X className="size-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Side sheet that slides in from the right (bottom sheet on small screens). */
export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-xl' }) {
  const panelRef = useRef(null);
  useOverlayBehaviour(open, onClose, panelRef);
  // Side sheet on tablet/desktop, bottom sheet on phones
  const isWide = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;
  const offscreen = isWide ? { x: '100%', y: 0 } : { x: 0, y: '100%' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={onClose} />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={clsx(
              'fixed z-50 flex flex-col bg-paper shadow-lift outline-none',
              'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-panel',
              'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:rounded-none sm:rounded-l-panel',
              width,
            )}
            initial={offscreen}
            animate={{ x: 0, y: 0 }}
            exit={offscreen}
            transition={spring.ui}
          >
            <Header title={title} description={description} onClose={onClose} />
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Centered dialog for confirmations and short forms. */
export function Modal({ open, onClose, title, description, children, footer, width = 'max-w-md' }) {
  const panelRef = useRef(null);
  useOverlayBehaviour(open, onClose, panelRef);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={onClose} />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              // Never taller than the screen: header stays put, the body scrolls
              className={clsx('pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-panel bg-paper shadow-lift outline-none', width)}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={spring.ui}
            >
              <Header title={title} description={description} onClose={onClose} />
              <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
              {footer && <div className="flex shrink-0 justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
