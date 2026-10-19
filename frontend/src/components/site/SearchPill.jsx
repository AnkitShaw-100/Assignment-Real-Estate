import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { MapPin } from 'lucide-react';
import { useCities } from '../../hooks/usePublic';
import { spring } from '../../lib/motion';

/** Hero search from the mockup: one location field and a Search button. */
export function SearchPill({ className, defaultValue = '' }) {
  const [q, setQ] = useState(defaultValue);
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();
  const listId = useId();

  const submit = (e) => {
    e.preventDefault();
    const value = q.trim();
    // An exact city match filters by city; anything else is a free-text search
    const city = cities.find((c) => c.toLowerCase() === value.toLowerCase());
    const params = new URLSearchParams(city ? { city } : value ? { q: value } : {});
    navigate(`/properties${params.size ? `?${params}` : ''}`);
  };

  return (
    <form onSubmit={submit} role="search" className={clsx('flex h-14 w-full items-center gap-2 rounded-full bg-paper/95 py-1.5 pr-1.5 pl-5 shadow-float backdrop-blur', className)}>
      <MapPin className="size-[18px] shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
      <label htmlFor={`${listId}-input`} className="sr-only">
        Where would you like to live?
      </label>
      <input
        id={`${listId}-input`}
        list={listId}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Lake Como, Los Angeles…"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-navy-900 placeholder:text-slate-500 focus:outline-none"
        autoComplete="off"
      />
      <datalist id={listId}>
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <motion.button
        type="submit"
        whileTap={{ scale: 0.96 }}
        transition={spring.ui}
        className="h-full shrink-0 rounded-full bg-navy-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        Search
      </motion.button>
    </form>
  );
}
