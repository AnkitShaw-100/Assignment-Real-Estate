import { ExploreBadge } from '../../../components/site/ExploreBadge';
import { Button } from '../../../components/ui/Button';

const IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=75';

/** Navy band with a house photo bleeding through, sitting on top of the footer like the mockup. */
export function CallToAction() {
  return (
    <section className="px-3 sm:px-4" aria-labelledby="cta-title">
      <div className="relative isolate overflow-hidden rounded-t-hero bg-navy-900">
        <img src={`${IMG}&w=1600`} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy-900 via-navy-900/70 to-navy-900/30" aria-hidden />
        <div className="container-page flex flex-col items-start gap-10 py-20 md:flex-row md:items-center md:gap-20 md:py-28">
          <ExploreBadge size={150} className="md:ml-16" />
          <div className="max-w-lg text-white">
            <h2 id="cta-title" className="font-display text-h1">
              Let’s find your dream home
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/75">
              Our agents guide you through every step, from the first viewing to the day you get the keys.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/contact">Talk to an agent</Button>
              <Button to="/properties" variant="light">
                Browse properties
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
