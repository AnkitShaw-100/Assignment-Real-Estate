import { Link } from 'react-router';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useProperties } from '../../../hooks/usePublic';
import { CarouselControls, CarouselItem, CarouselTrack, useCarousel } from '../../../components/site/Carousel';
import { PropertyCard, PropertyCardSkeleton } from '../../../components/site/PropertyCard';
import { ErrorState } from '../../../components/ui/States';
import { coverOf, formatPrice, imageUrl } from '../../../lib/format';
import { spring } from '../../../lib/motion';

/** The expanded first card from the mockup: text panel + photo side by side. */
function FeatureCard({ property }) {
  const cover = coverOf(property);
  return (
    <Link to={`/properties/${property.slug}`} className="group block h-full">
      <motion.article whileTap={{ scale: 0.985 }} transition={spring.ui} className="grid h-full grid-cols-1 overflow-hidden rounded-card bg-mist-100 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="flex flex-col p-6">
          <h3 className="font-display text-[26px] leading-tight">{property.title}</h3>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-500">{property.description}</p>
          <p className="mt-4 text-lg font-semibold text-brass-500 tabular">{formatPrice(property.price, { purpose: property.purpose })}</p>
          <ul className="mt-auto space-y-1.5 pt-6 text-[13px] text-slate-500">
            {[property.location.area, property.location.city, property.location.country].filter(Boolean).map((l) => (
              <li key={l} className="flex items-center gap-1.5">
                <MapPin className="size-3.5" strokeWidth={1.5} aria-hidden />
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[240px] overflow-hidden">
          <motion.img
            layoutId={`property-image-${property._id}`}
            src={imageUrl(cover?.url, 900)}
            alt={cover?.alt ?? property.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-out-soft group-hover:scale-[1.04]"
          />
        </div>
      </motion.article>
    </Link>
  );
}

export function PopularListings() {
  const carousel = useCarousel();
  const { data, isPending, isError, error, refetch } = useProperties({ sort: 'popular', category: 'residential', limit: 8 });
  const [first, ...rest] = data?.data ?? [];

  return (
    <section className="container-page py-16 md:py-24" aria-labelledby="popular-title">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h2 id="popular-title" className="font-display text-h1">
            Popular listings
          </h2>
          <p className="mt-3 max-w-sm text-slate-500">The homes people viewed most this month, picked to inspire.</p>
        </div>
        <CarouselControls carousel={carousel} label="popular listings" className="hidden sm:flex" />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <CarouselTrack carousel={carousel} label="Popular listings">
          {isPending
            ? Array.from({ length: 4 }, (_, i) => (
                <CarouselItem key={i} className="w-[78%] sm:w-[42%] lg:w-[23%]">
                  <PropertyCardSkeleton />
                </CarouselItem>
              ))
            : [
                first && (
                  <CarouselItem key={first._id} className="w-[88%] sm:w-[70%] lg:w-[46%]">
                    <FeatureCard property={first} />
                  </CarouselItem>
                ),
                ...rest.map((p) => (
                  <CarouselItem key={p._id} className="w-[72%] sm:w-[40%] lg:w-[21%]">
                    <PropertyCard property={p} variant="compact" />
                  </CarouselItem>
                )),
              ]}
        </CarouselTrack>
      )}
      <CarouselControls carousel={carousel} label="popular listings" className="mt-6 sm:hidden" />
    </section>
  );
}
