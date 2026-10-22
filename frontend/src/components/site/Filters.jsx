import { useEffect, useId, useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { useCities } from '../../hooks/usePublic';
import { useDebounced } from '../../hooks/useDebounced';
import { Field, Input, Select } from '../ui/Field';
import { Combobox } from '../ui/Combobox';
import { BEDROOM_OPTIONS, PROPERTY_TYPES } from '../../lib/constants';
import { formatPrice } from '../../lib/format';
import { spring } from '../../lib/motion';

const SALE_PRICES = [250_000, 500_000, 750_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000];
const RENT_PRICES = [1_000, 2_000, 3_000, 5_000, 10_000, 20_000, 30_000];

/** Segmented control (iOS-style) with a sliding thumb. */
export function Segmented({ value, onChange, options, label, className }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={clsx('relative flex rounded-full bg-mist-100 p-1', className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx('relative z-10 h-9 flex-1 rounded-full px-3 text-sm font-medium transition-colors', active ? 'text-navy-900' : 'text-slate-500 hover:text-navy-900')}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-full bg-paper shadow-[0_1px_3px_rgb(12_26_59/0.12)]" transition={spring.ui} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * All listing filters. `values` are the current URL params; `onChange(patch)`
 * merges a partial update into the URL. Used by the desktop sidebar and the mobile sheet.
 */
export function FilterFields({ values, onChange }) {
  const { data: cities = [] } = useCities();
  // Location is typed, so debounce it before touching the URL
  const [location, setLocation] = useState(values.city || values.q || '');
  const debounced = useDebounced(location);
  useEffect(() => setLocation(values.city || values.q || ''), [values.city, values.q]);
  useEffect(() => {
    if (debounced === (values.city || values.q || '')) return;
    const city = cities.find((c) => c.toLowerCase() === debounced.trim().toLowerCase());
    onChange(city ? { city, q: '' } : { q: debounced.trim(), city: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const prices = values.purpose === 'rent' ? RENT_PRICES : SALE_PRICES;
  const priceOptions = prices.map((p) => ({ value: String(p), label: formatPrice(p, { compact: true }) }));
  const types = PROPERTY_TYPES.filter((t) => !values.category || t.category === values.category || t.value === 'land');

  return (
    <div className="flex flex-col gap-6">
      <Field label="Location">
        {(a11y) => (
          <Combobox
            {...a11y}
            as={Input}
            value={location}
            onChange={setLocation}
            onPick={(city) => onChange({ city, q: '' })} // apply a picked city straight away
            suggestions={cities}
            placeholder="City, area or country"
          />
        )}
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Looking to</span>
        <Segmented
          label="Looking to"
          value={values.purpose || ''}
          onChange={(purpose) => onChange({ purpose, minPrice: '', maxPrice: '' })}
          options={[
            { value: '', label: 'Any' },
            { value: 'sale', label: 'Buy' },
            { value: 'rent', label: 'Rent' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Property use</span>
        <Segmented
          label="Property use"
          value={values.category || ''}
          onChange={(category) => onChange({ category, type: '' })}
          options={[
            { value: '', label: 'All' },
            { value: 'residential', label: 'Homes' },
            { value: 'commercial', label: 'Commercial' },
          ]}
        />
      </div>

      <Field label="Property type">
        {(a11y) => <Select {...a11y} value={values.type || ''} onChange={(e) => onChange({ type: e.target.value })} placeholder="Any type" options={types} />}
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Price{values.purpose === 'rent' ? ' per month' : ''}</legend>
        <div className="grid grid-cols-2 gap-2">
          <Select aria-label="Minimum price" value={values.minPrice || ''} onChange={(e) => onChange({ minPrice: e.target.value })} placeholder="No min" options={priceOptions} />
          <Select aria-label="Maximum price" value={values.maxPrice || ''} onChange={(e) => onChange({ maxPrice: e.target.value })} placeholder="No max" options={priceOptions} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Bedrooms</legend>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((o) => {
            const active = (values.beds || '') === o.value;
            return (
              <motion.button
                key={o.label}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={spring.ui}
                onClick={() => onChange({ beds: o.value })}
                aria-pressed={active}
                className={clsx(
                  'h-10 min-w-12 rounded-full border px-4 text-sm font-medium transition-colors',
                  active ? 'border-navy-900 bg-navy-900 text-white' : 'border-line hover:border-navy-600',
                )}
              >
                {o.label}
              </motion.button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
