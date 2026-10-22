import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { panelClass, panelMotion, panelStyle, useAnchoredPosition, useDismiss } from './popover';

/** Wraps the part of `text` that matches `query` in <mark>. */
function Highlight({ text, query }) {
  const i = query ? text.toLowerCase().indexOf(query) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-navy-900">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Free-text input with a styled suggestion list (replaces <datalist>, which
 * browsers render as an unstyleable tooltip). Typing filters the suggestions,
 * matches that start with the query come first. Arrow keys move, Enter picks
 * the highlighted one; with nothing highlighted Enter submits the form as typed.
 *
 *   value / onChange(text)  the input text (controlled)
 *   onPick(text)            optional, called when a suggestion is chosen
 *   anchorRef               optional element to align the list to (defaults to the input)
 *   as                      input component, e.g. the design-system <Input>
 */
export function Combobox({ value, onChange, onPick, suggestions = [], anchorRef, as: InputEl = 'input', onKeyDown, onFocus, ...inputProps }) {
  const listId = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const query = value.trim().toLowerCase();
  // When the text already equals a suggestion, show them all so it's easy to switch
  const exact = suggestions.some((s) => s.toLowerCase() === query);
  const matches = !query || exact
    ? suggestions
    : suggestions
        .filter((s) => s.toLowerCase().includes(query))
        .sort((a, b) => Number(!a.toLowerCase().startsWith(query)) - Number(!b.toLowerCase().startsWith(query)));
  const visible = open && matches.length > 0;

  const pos = useAnchoredPosition(anchorRef ?? inputRef, visible, matches.length * 44 + 12);
  useDismiss(visible, [inputRef, listRef, ...(anchorRef ? [anchorRef] : [])], () => setOpen(false));

  useEffect(() => {
    if (visible && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [visible, active, listId]);

  const pick = (s) => {
    onChange(s);
    onPick?.(s);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const last = matches.length - 1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visible) {
        setOpen(true);
        setActive(e.key === 'ArrowDown' ? 0 : last);
      } else {
        setActive((a) => (e.key === 'ArrowDown' ? (a >= last ? 0 : a + 1) : a <= 0 ? last : a - 1));
      }
    } else if (e.key === 'Enter' && visible && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape' && visible) {
      e.preventDefault();
      e.stopPropagation(); // don't also close a surrounding sheet
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <InputEl
        ref={inputRef}
        {...inputProps}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
      />
      {createPortal(
        <AnimatePresence>
          {visible && pos && (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Suggestions"
              {...panelMotion(pos.up)}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              style={panelStyle(pos)}
              className={panelClass}
            >
              {matches.map((s, i) => {
                const selected = s.toLowerCase() === query;
                return (
                  <li
                    key={s}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={selected}
                    onPointerMove={() => active !== i && setActive(i)}
                    onClick={() => pick(s)}
                    className={clsx(
                      'flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] leading-tight text-slate-600 select-none',
                      i === active && 'bg-mist-100',
                    )}
                  >
                    <span className={clsx('grid size-7 shrink-0 place-items-center rounded-full', selected ? 'bg-navy-900 text-white' : 'bg-mist-100 text-slate-500')}>
                      <MapPin className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <Highlight text={s} query={exact ? '' : query} />
                    </span>
                    {selected && <Check className="size-4 shrink-0 text-brass-700" aria-hidden />}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
