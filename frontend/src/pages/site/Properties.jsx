import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { SearchX, SlidersHorizontal, X } from '../../components/ui/icons';
import { useProperties } from '../../hooks/usePublic';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FilterFields } from '../../components/site/Filters';
import { PropertyCard, PropertyCardSkeleton } from '../../components/site/PropertyCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import { Drawer } from '../../components/ui/Overlay';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { PROPERTY_TYPES, labelOf } from '../../lib/constants';
import { formatPrice } from '../../lib/format';
import { ease } from '../../lib/motion';

const FILTER_KEYS = ['q', 'city', 'purpose', 'category', 'type', 'minPrice', 'maxPrice', 'beds'];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most viewed' },
];

/** Headline that reads the filters back in plain words: "Villas to buy in Dubai". */
function describe(v) {
  const type = v.type ? `${labelOf(PROPERTY_TYPES, v.type)}s` : v.category === 'commercial' ? 'Commercial spaces' : v.category === 'residential' ? 'Homes' : 'Properties';
  const purpose = v.purpose === 'rent' ? ' to rent' : v.purpose === 'sale' ? ' for sale' : '';
  const where = v.city ? ` in ${v.city}` : v.q ? ` matching “${v.q}”` : '';
  return `${type}${purpose}${where}`;
}

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  // The URL is the single source of truth for filters: shareable, and Back works
  const values = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const page = Number(values.page) || 1;
  const sort = values.sort || 'newest';

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) if (v) next.set(k, v);
      else next.delete(k);
    if (!('page' in patch)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: !('page' in patch), preventScrollReset: true });
  };
  const clear = () => setParams(sort !== 'newest' ? { sort } : {});
  const activeCount = FILTER_KEYS.filter((k) => values[k]).length;

  const query = { ...Object.fromEntries(FILTER_KEYS.map((k) => [k, values[k]])), sort, page, limit: 12 };
  const { data, isPending, isFetching, isError, error, refetch } = useProperties(query);
  const heading = describe(values);
  usePageTitle(heading);

  const chips = FILTER_KEYS.filter((k) => values[k]).map((k) => ({
    key: k,
    label:
      k === 'minPrice' ? `From ${formatPrice(+values[k], { compact: true })}`
      : k === 'maxPrice' ? `Up to ${formatPrice(+values[k], { compact: true })}`
      : k === 'beds' ? `${values[k]}${values[k] === '5' ? '+' : ''} beds`
      : k === 'purpose' ? (values[k] === 'rent' ? 'To rent' : 'For sale')
      : k === 'type' ? labelOf(PROPERTY_TYPES, values[k])
      : k === 'category' ? (values[k] === 'commercial' ? 'Commercial' : 'Homes')
      : values[k],
  }));

  return (
    <div className="container-page pt-10 pb-24 md:pt-14">
      <header className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-h1">{heading}</h1>
          <p className="mt-3 text-slate-500" aria-live="polite">
            {isPending ? 'Finding homes…' : `${data?.total ?? 0} ${data?.total === 1 ? 'property' : 'properties'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={SlidersHorizontal} className="lg:hidden" onClick={() => setSheetOpen(true)}>
            Filters{activeCount ? ` (${activeCount})` : ''}
          </Button>
          <Select aria-label="Sort by" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })} options={SORTS} className="w-52" />
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-h3">Filters</h2>
              {activeCount > 0 && (
                <button type="button" onClick={clear} className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-navy-900 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <FilterFields values={values} onChange={update} />
          </div>
        </aside>

        <section aria-label="Results" aria-busy={isFetching}>
          {chips.length > 0 && (
            <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
              <AnimatePresence initial={false}>
                {chips.map((c) => (
                  <motion.li key={c.key} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <button
                      type="button"
                      onClick={() => update(c.key === 'q' || c.key === 'city' ? { q: '', city: '' } : { [c.key]: '' })}
                      className="flex h-8 items-center gap-1.5 rounded-full bg-mist-100 pr-2.5 pl-3.5 text-sm hover:bg-mist-200"
                      aria-label={`Remove filter: ${c.label}`}
                    >
                      {c.label}
                      <X className="size-3.5 text-slate-500" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : isPending ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : data.data.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No homes match these filters"
              description="Try a wider price range or another area. New homes are added every week."
              action={
                <Button variant="dark" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <motion.div
              key={`${params.toString()}`}
              className="grid gap-x-6 gap-y-10 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3"
              style={{ opacity: isFetching ? 0.55 : 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: ease.out }}
            >
              {data.data.map((p) => (
                <PropertyCard key={p._id} property={p} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw" />
              ))}
            </motion.div>
          )}

          {data && data.pages > 1 && <Pagination page={page} pages={data.pages} onChange={(p) => { update({ page: p > 1 ? String(p) : '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
        </section>
      </div>

      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="ghost" onClick={clear}>
              Clear all
            </Button>
            <Button variant="dark" onClick={() => setSheetOpen(false)}>
              Show {data?.total ?? ''} {data?.total === 1 ? 'property' : 'properties'}
            </Button>
          </>
        }
      >
        <FilterFields values={values} onChange={update} />
      </Drawer>
    </div>
  );
}

function Pagination({ page, pages, onChange }) {
  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`size-9 rounded-full text-sm font-medium tabular ${p === page ? 'bg-navy-900 text-white' : 'hover:bg-mist-100'}`}
        >
          {p}
        </button>
      ))}
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
