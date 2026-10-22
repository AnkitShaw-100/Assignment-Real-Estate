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

