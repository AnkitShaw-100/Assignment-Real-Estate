import { useProperties } from '../../../hooks/usePublic';
import { CarouselItem, CarouselTrack, useCarousel } from '../../../components/site/Carousel';
import { PropertyCard, PropertyCardSkeleton } from '../../../components/site/PropertyCard';
import { ErrorState } from '../../../components/ui/States';
import { Button } from '../../../components/ui/Button';

export function FeaturedHomes() {
  const carousel = useCarousel();
  const { data, isPending, isError, error, refetch } = useProperties({ featured: 'true', limit: 12 });

  return (
    <section className="container-page py-24 md:py-32" aria-labelledby="featured-title">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h2 id="featured-title" className="font-display text-h1">
            Featured homes
          </h2>
          <p className="mt-3 max-w-xs text-slate-500">A selection of the finest homes, handpicked by our agents.</p>
        </div>
        <Button to="/properties" variant="secondary" className="shrink-0">
          See all properties
        </Button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <CarouselTrack carousel={carousel} label="Featured homes">
          {(isPending ? Array.from({ length: 4 }) : data.data).map((p, i) => (
            <CarouselItem key={p?._id ?? i} className="w-[78%] sm:w-[44%] lg:w-[calc((100%-60px)/4)]">
              {p ? <PropertyCard property={p} variant="compact" /> : <PropertyCardSkeleton />}
            </CarouselItem>
          ))}
        </CarouselTrack>
      )}
    </section>
  );
}
