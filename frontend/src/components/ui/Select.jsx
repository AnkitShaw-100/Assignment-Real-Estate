import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from './icons';
import clsx from 'clsx';
import { panelClass, panelMotion, panelStyle, useAnchoredPosition, useDismiss } from './popover';

const noop = () => {};

/**
 * Styled listbox with the same API as a native <select>: works controlled
 * (value + onChange(e)) and with react-hook-form's register(). A hidden
 * native select holds the value, so forms, refs and change events behave as
 * before; the visible part is a select-only combobox (WAI-ARIA APG pattern).
 */
export const Select = forwardRef(function Select(
  { className, options = [], placeholder, value, defaultValue, onChange, onBlur, name, disabled, id, ...aria },
  ref,
) {
  const listId = useId();
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const selectRef = useRef(null);
  const typeahead = useRef({ text: '', at: 0 });

  const items = (placeholder !== undefined ? [{ value: '', label: placeholder, placeholder: true }, ...options] : options).map((o) => ({
    ...o,
    value: String(o.value),
  }));

  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue !== undefined ? String(defaultValue) : '');
  const current = controlled ? String(value ?? '') : inner;
  const selectedIndex = items.findIndex((i) => i.value === current);
  const selected = items[selectedIndex] ?? (controlled ? undefined : items[0]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const setSelect = useCallback(
    (el) => {
      selectRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  // react-hook-form writes `el.value = …` for defaults and reset() without
  // firing events; pick those writes up after each render. Runs on every
  // render on purpose, and only sets state when the value actually differs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = selectRef.current;
    if (!controlled && el && el.value !== inner) setInner(el.value);
  });

  const show = (index = selectedIndex) => {
    if (disabled) return;
    setActive(Math.max(0, index));
    setOpen(true);
  };

  const choose = (v) => {
    setOpen(false);
    buttonRef.current?.focus();
    const el = selectRef.current;
    if (!el || v === current) return;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, v);
    if (!controlled) setInner(v);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const pos = useAnchoredPosition(buttonRef, open);
  useDismiss(open, [buttonRef, listRef], () => setOpen(false));

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, listId]);

  const onKeyDown = (e) => {
    const last = items.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const move = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last, PageDown: Math.min(active + 8, last), PageUp: Math.max(active - 8, 0) };
    if (e.key in move) {
      e.preventDefault();
      setActive(move[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (items[active]) choose(items[active].value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // don't also close a surrounding drawer
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1) {
      const now = Date.now();
      const t = typeahead.current;
      t.text = (now - t.at > 600 ? '' : t.text) + e.key.toLowerCase();
      t.at = now;
      const hit = items.findIndex((i) => i.label.toLowerCase().startsWith(t.text));
      if (hit >= 0) setActive(hit);
    }
  };

  const invalid = Boolean(aria['aria-invalid']);

  return (
    <div className={clsx('relative', className)}>
      <select
        ref={setSelect}
        name={name}
        value={controlled ? current : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={onChange ?? noop}
        disabled={disabled}
        onFocus={() => buttonRef.current?.focus()} // RHF focuses the first invalid field
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      >
        {items.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={() => !open && onBlur?.({ type: 'blur', target: selectRef.current })}
        className={clsx(
          'flex h-11 w-full cursor-pointer items-center gap-2 rounded-field border bg-paper pr-3 pl-3.5 text-left text-[15px] transition-[border-color,box-shadow] duration-200',
          'focus:outline-none focus-visible:border-accent-400 focus-visible:ring-3 focus-visible:ring-accent-400/25',
          'disabled:cursor-not-allowed disabled:bg-mist-100 disabled:text-slate-500',
          open ? 'border-accent-400 ring-3 ring-accent-400/25' : invalid ? 'border-danger' : 'border-line hover:border-slate-400',
        )}
        {...aria}
      >
        <span className={clsx('min-w-0 flex-1 truncate', selected?.placeholder ? 'text-slate-500' : 'text-navy-900')}>{selected?.label ?? ''}</span>
        <ChevronDown
          className={clsx('size-4 shrink-0 text-slate-500 transition-transform duration-200 ease-out-soft', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={aria['aria-label']}
              {...panelMotion()}
              onMouseDown={(e) => e.preventDefault()} // keep focus on the trigger
              style={panelStyle(pos)}
              className={panelClass}
            >
              {items.map((o, i) => {
                const isSelected = o.value === current;
                return (
                  <li
                    key={o.value}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onPointerMove={() => active !== i && setActive(i)}
                    onClick={() => choose(o.value)}
                    className={clsx(
                      'flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] leading-tight select-none',
                      i === active && 'bg-mist-100',
                      isSelected ? 'font-medium text-navy-900' : o.placeholder ? 'text-slate-500' : 'text-navy-900',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate" title={o.label}>
                      {o.label}
                    </span>
                    <Check className={clsx('size-4 shrink-0 text-accent-700', !isSelected && 'invisible')} aria-hidden />
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
});
