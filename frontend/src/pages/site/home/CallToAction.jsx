import { Check } from 'lucide-react';
import { ExploreBadge } from '../../../components/site/ExploreBadge';
import { Button } from '../../../components/ui/Button';

const IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=75';

const PROMISES = ['Every home visited by our own agents', 'Viewings arranged within 48 hours', 'One agent from first call to keys'];

/** Light split card that closes the page, kept visually separate from the navy footer. */
export function CallToAction() {
  return (
    <section className="container-page pb-20 md:pb-28" aria-labelledby="cta-title">
      <div className="grid overflow-hidden rounded-hero bg-mist-100 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <h2 id="cta-title" className="font-display text-h1">
            Let’s find your dream home
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-slate-500">
            Our agents guide you through every step, from the first viewing to the day you get the keys.
          </p>
          <ul className="mt-7 space-y-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[15px] text-navy-900">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-500 text-white">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/contact">Talk to an agent</Button>
            <Button to="/properties" variant="secondary">
              Browse properties
            </Button>
          </div>
        </div>
        <div className="relative min-h-[300px] md:min-h-[480px]">
          <img
            src={`${IMG}&w=1400`}
            srcSet={`${IMG}&w=800 800w, ${IMG}&w=1400 1400w`}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt="A modern timber and glass home lit up at dusk"
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <ExploreBadge size={132} className="absolute bottom-6 left-6 hidden sm:block" />
        </div>
      </div>
    </section>
  );
}
