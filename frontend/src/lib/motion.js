// Motion tokens from docs/DESIGN.md §5. Import these instead of hand-writing
// easing values so every animation in the app moves the same way.

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
};

export const spring = {
  /** Buttons, toggles, drawers, chips — quick and firm */
  ui: { type: 'spring', stiffness: 400, damping: 32 },
  /** Carousels, shared-element transitions — softer, more travel */
  soft: { type: 'spring', stiffness: 180, damping: 26 },
};

export const duration = { fast: 0.16, base: 0.28, slow: 0.6 };

/** Press feedback for anything tappable */
export const press = { whileTap: { scale: 0.97 }, transition: spring.ui };

/** One-time image reveal when a section first enters the viewport */
export const clipReveal = {
  initial: { clipPath: 'inset(6% 6% 6% 6% round 14px)', opacity: 0.6 },
  whileInView: { clipPath: 'inset(0% 0% 0% 0% round 14px)', opacity: 1 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: 0.7, ease: ease.out },
};
