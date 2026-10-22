import { useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  AirVent, ArrowUpDown, Bath, BedDouble, Briefcase, CalendarDays, Car, Check, Clock, ConciergeBell, Dumbbell,
  Flame, HousePlug, Mail, MapPin, Phone, PlugZap, Ruler, ShieldCheck, Shirt, Sunset, Trees, Truck, Waves, Wifi, Building,
} from '../../components/ui/icons';
import { useProperty, useSimilar } from '../../hooks/usePublic';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Gallery } from '../../components/site/Gallery';
import { InquiryForm } from '../../components/site/InquiryForm';
import { PropertyCard, SaveButton } from '../../components/site/PropertyCard';
import { PropertyStatusBadge } from '../../components/ui/Badge';
import { Avatar, ErrorState, Skeleton } from '../../components/ui/States';
import { Button } from '../../components/ui/Button';
import { PROPERTY_TYPES, labelOf } from '../../lib/constants';
import { formatNumber, formatPrice } from '../../lib/format';
import { ease } from '../../lib/motion';

const AMENITY_ICONS = {
  'Swimming pool': Waves, Garden: Trees, 'Air conditioning': AirVent, Fireplace: Flame, 'Home office': Briefcase,
  'Smart home': HousePlug, Gym: Dumbbell, Security: ShieldCheck, Balcony: Building, 'Sea view': Sunset, 'Walk-in closet': Shirt,
  'EV charging': PlugZap, '24/7 access': Clock, Reception: ConciergeBell, Elevator: ArrowUpDown, 'Loading bay': Truck,
  'Fibre internet': Wifi, Parking: Car,
};

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: ease.out, delay: 0.15 } };

export default function PropertyDetail() {
  const { slug } = useParams();
  const { data: property, isPending, isError, error, refetch } = useProperty(slug);
  const { data: similar = [] } = useSimilar(slug);
  usePageTitle(property?.title ?? 'Property');

  if (isError) {
    return (
      <div className="container-page py-24">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} />
        <div className="mt-6 text-center">
          <Button to="/properties" variant="secondary">
            Browse other properties
          </Button>
        </div>
      </div>
    );
  }
  if (isPending) return <DetailSkeleton />;

  const { location: loc, agent } = property;
  const facts = [
    property.bedrooms > 0 && { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms },
    property.bathrooms > 0 && { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
    property.areaSqft && { icon: Ruler, label: 'Living area', value: `${formatNumber(property.areaSqft)} sq ft` },
    property.parking > 0 && { icon: Car, label: 'Parking', value: property.parking },
    property.yearBuilt && { icon: CalendarDays, label: 'Built', value: property.yearBuilt },
  ].filter(Boolean);

  return (
    <article className="container-page pt-8 pb-24">
      <Gallery property={property} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <motion.div {...fadeUp}>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{labelOf(PROPERTY_TYPES, property.type)}</span>
            <span aria-hidden>·</span>
            <span>{property.purpose === 'rent' ? 'For rent' : 'For sale'}</span>
            {property.status !== 'available' && <PropertyStatusBadge status={property.status} />}
          </div>
          <div className="mt-3 flex items-start justify-between gap-6">
            <h1 className="font-display text-h1">{property.title}</h1>
            <SaveButton propertyId={property._id} className="mt-1 shrink-0" />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-slate-500">
            <MapPin className="size-4" strokeWidth={1.5} />
            {[loc.address, loc.area, loc.city, loc.country].filter(Boolean).join(', ')}
          </p>
          <p className="mt-6 font-display text-[40px] leading-none tabular" style={{ fontWeight: 400 }}>
            {formatPrice(property.price, { currency: property.currency, purpose: property.purpose })}
          </p>

          {facts.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 overflow-hidden rounded-panel border border-line sm:grid-cols-3 xl:grid-cols-5">
              {facts.map(({ icon: Icon, label, value }) => (
                // right + bottom hairline per cell; the container clips the outer ones, empty cells stay white
                <div key={label} className="-mr-px -mb-px border-r border-b border-line p-5">
                  <Icon className="size-5 text-slate-500" strokeWidth={1.5} aria-hidden />
                  <dt className="mt-3 text-sm text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <section className="mt-12" aria-labelledby="about-home">
            <h2 id="about-home" className="font-display text-h2">
              About this {property.category === 'commercial' ? 'space' : 'home'}
            </h2>
            <p className="mt-5 max-w-[68ch] text-[17px] leading-[1.75] whitespace-pre-line text-slate-500">{property.description}</p>
          </section>

          {property.amenities?.length > 0 && (
            <section className="mt-12" aria-labelledby="amenities">
              <h2 id="amenities" className="font-display text-h2">
                What’s included
              </h2>
              <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {property.amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a] ?? Check;
                  return (
                    <li key={a} className="flex items-center gap-3 border-b border-line pb-4">
                      <Icon className="size-5 text-navy-700" strokeWidth={1.5} aria-hidden />
                      {a}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </motion.div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Contact the agent">
          <div className="rounded-panel border border-line p-6 shadow-float">
            {agent && (
              <div className="mb-6 flex items-center gap-4 border-b border-line pb-6">
                <Avatar user={agent} size={56} />
                <div className="min-w-0">
                  <p className="font-semibold">{agent.name}</p>
                  <p className="text-sm text-slate-500">{agent.title ?? 'Niwas agent'}</p>
                  <div className="mt-2 flex gap-3 text-sm">
                    {agent.phone && (
                      <a href={`tel:${agent.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 font-medium hover:underline">
                        <Phone className="size-3.5" /> Call
                      </a>
                    )}
                    <a href={`mailto:${agent.email}?subject=${encodeURIComponent(property.title)}`} className="flex items-center gap-1 font-medium hover:underline">
                      <Mail className="size-3.5" /> Email
                    </a>
                  </div>
                </div>
              </div>
            )}
            <h2 className="mb-5 font-display text-h3">Interested in this {property.category === 'commercial' ? 'space' : 'home'}?</h2>
            <InquiryForm property={property} agentName={agent?.name} compact />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-24" aria-labelledby="similar">
          <h2 id="similar" className="font-display text-h1">
            You might also like
          </h2>
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-page pt-8 pb-24" aria-busy="true" aria-label="Loading property">
      <div className="grid gap-3 md:h-[540px] md:grid-cols-[2fr_1fr] md:grid-rows-2">
        <Skeleton className="aspect-[4/3] rounded-panel md:row-span-2 md:aspect-auto md:h-full" />
        <Skeleton className="hidden rounded-panel md:block" />
        <Skeleton className="hidden rounded-panel md:block" />
      </div>
      <Skeleton className="mt-10 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-5 w-1/3" />
    </div>
  );
}
