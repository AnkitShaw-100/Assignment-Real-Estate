import { Heart } from '../../components/ui/icons';
import { useSavedProperties } from '../../hooks/usePublic';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PropertyCard, PropertyCardSkeleton } from '../../components/site/PropertyCard';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { Button } from '../../components/ui/Button';

export default function Saved() {
  usePageTitle('Saved homes');
  const { data, isPending, isError, error, refetch } = useSavedProperties();

  return (
    <section className="container-page pt-14 pb-24">
      <h1 className="font-display text-h1">Saved homes</h1>
      <p className="mt-3 text-slate-500">Homes you’ve tapped the heart on. Sold or withdrawn homes drop off this list.</p>
      <div className="mt-10">
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved homes yet"
            description="Tap the heart on any listing to keep it here for later."
            action={<Button to="/properties" variant="dark">Browse properties</Button>}
          />
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
