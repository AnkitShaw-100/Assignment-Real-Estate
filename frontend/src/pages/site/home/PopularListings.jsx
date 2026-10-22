import { Link } from 'react-router';
import { MapPin } from '../../../components/ui/icons';
import { useProperties } from '../../../hooks/usePublic';
import { CarouselControls, CarouselItem, CarouselTrack, useCarousel } from '../../../components/site/Carousel';
import { FadeImage } from '../../../components/ui/FadeImage';
import { ErrorState } from '../../../components/ui/States';
import { coverOf, formatPrice, imageUrl } from '../../../lib/format';

/** Wide listing card: text panel + photo side by side. */
function FeatureCard({ property }) {
  const cover = coverOf(property);
  return (
    <Link to={`/properties/${property.slug}`} className="group block h-full">
      <article className="grid h-full grid-cols-1 overflow-hidden rounded-card bg-mist-100 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="flex flex-col p-6">
          <h3 className="font-display text-[26px] leading-tight transition-colors group-hover:text-accent-700">{property.title}</h3>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-500">{property.description}</p>
          <p className="mt-4 text-lg font-semibold text-accent-700 tabular">{formatPrice(property.price, { purpose: property.purpose })}</p>
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
          <FadeImage className="absolute inset-0" src={imageUrl(cover?.url, 900)} alt={cover?.alt ?? property.title} />
        </div>
      </article>
    </Link>
  );
}

// Every card uses the wide layout; two fit side by side on desktop
const CARD_WIDTH = 'w-[88%] sm:w-[70%] lg:w-[calc((100%-20px)/2)]';

function FeatureCardSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 overflow-hidden rounded-card bg-mist-100 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]" aria-hidden>
      <div className="flex flex-col gap-3 p-6">
        <div className="skeleton h-7 w-4/5 rounded" />
        <div className="skeleton h-7 w-3/5 rounded" />
        <div className="skeleton mt-2 h-16 w-full rounded" />
        <div className="skeleton mt-2 h-6 w-1/3 rounded" />
      </div>
      <div className="skeleton min-h-[240px]" />
    </div>
  );
}

export function PopularListings() {
  const carousel = useCarousel();
  const { data, isPending, isError, error, refetch } = useProperties({ sort: 'popular', category: 'residential', limit: 8 });

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
                <CarouselItem key={i} className={CARD_WIDTH}>
                  <FeatureCardSkeleton />
                </CarouselItem>
              ))
            : data.data.map((p) => (
                <CarouselItem key={p._id} className={CARD_WIDTH}>
                  <FeatureCard property={p} />
                </CarouselItem>
              ))}
        </CarouselTrack>
      )}
      <CarouselControls carousel={carousel} label="popular listings" className="mt-6 sm:hidden" />
    </section>
  );
}
