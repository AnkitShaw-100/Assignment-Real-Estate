import { Link } from 'react-router';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { Bath, BedDouble, Heart, MapPin, Ruler } from 'lucide-react';
import { coverOf, formatNumber, formatPrice, imageUrl } from '../../lib/format';
import { spring } from '../../lib/motion';
import { useSaveToggle } from '../../hooks/usePublic';
import { PropertyStatusBadge } from '../ui/Badge';

export function SaveButton({ propertyId, className }) {
  const { isSaved, toggle } = useSaveToggle();
  const saved = isSaved(propertyId);
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(propertyId);
      }}
      whileTap={{ scale: 0.85 }}
      transition={spring.ui}
      className={clsx('glass grid size-10 place-items-center rounded-full text-navy-900 shadow-float', className)}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved homes' : 'Save this home'}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={spring.ui}>
        <Heart className={clsx('size-[18px]', saved && 'fill-accent-400 text-accent-500')} strokeWidth={1.75} />
      </motion.span>
    </motion.button>
  );
}

/**
 * Listing card. The image carries a layoutId so it morphs into the hero of
 * the detail page when opened (the shared-element transition in DESIGN.md §5).
 */
export function PropertyCard({ property, variant = 'full', className, sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw' }) {
  const cover = coverOf(property);
  const showStatus = property.status && property.status !== 'available';

  return (
    <Link to={`/properties/${property.slug}`} className={clsx('group block outline-none', className)} aria-label={`${property.title}, ${formatPrice(property.price, { purpose: property.purpose })}`}>
      <motion.div whileTap={{ scale: 0.985 }} transition={spring.ui}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-mist-100 ring-accent-400 ring-offset-2 group-focus-visible:ring-2">
          <motion.img
            layoutId={`property-image-${property._id}`}
            src={imageUrl(cover?.url, 800)}
            srcSet={cover ? `${imageUrl(cover.url, 480)} 480w, ${imageUrl(cover.url, 800)} 800w, ${imageUrl(cover.url, 1200)} 1200w` : undefined}
            sizes={sizes}
            alt={cover?.alt ?? property.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-[600ms] ease-out-soft group-hover:scale-[1.04]"
          />
          <SaveButton propertyId={property._id} className="absolute top-3 right-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100" />
          {showStatus && <PropertyStatusBadge status={property.status} className="absolute top-3 left-3" />}
        </div>

        <div className="mt-3.5">
          <h3 className="font-display text-[19px] leading-snug" style={{ fontWeight: 400 }}>
            {property.title}
          </h3>
          <p className="mt-1 text-[15px] font-semibold text-accent-700 tabular">{formatPrice(property.price, { purpose: property.purpose })}</p>
          {variant === 'full' && (
            <>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="size-3.5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">
                  {[property.location?.area, property.location?.city, property.location?.country].filter(Boolean).join(', ')}
                </span>
              </p>
              <Facts property={property} className="mt-3" />
            </>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function Facts({ property, className }) {
  const facts = [
    property.bedrooms > 0 && { icon: BedDouble, label: `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}` },
    property.bathrooms > 0 && { icon: Bath, label: `${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}` },
    property.areaSqft && { icon: Ruler, label: `${formatNumber(property.areaSqft)} sq ft` },
  ].filter(Boolean);
  if (!facts.length) return null;
  return (
    <ul className={clsx('flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500', className)}>
      {facts.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-4" strokeWidth={1.5} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-card" />
      <div className="skeleton mt-4 h-5 w-3/4 rounded" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded" />
      <div className="skeleton mt-3 h-4 w-1/2 rounded" />
    </div>
  );
}
