import { motion } from 'motion/react';
import { ExploreBadge } from '../../../components/site/ExploreBadge';
import { clipReveal } from '../../../lib/motion';

const IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80';

export function Story() {
  return (
    <section className="container-page pt-20 pb-16 md:pt-28 md:pb-20" aria-labelledby="story-title">
      <div className="relative grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-0">
        <div className="relative z-10 md:py-10">
          <motion.img
            {...clipReveal}
            src={`${IMG}&w=1100`}
            srcSet={`${IMG}&w=640 640w, ${IMG}&w=1100 1100w`}
            sizes="(min-width: 768px) 45vw, 100vw"
            alt="House keys resting beside a small model home"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-card object-cover md:w-[108%] md:max-w-none"
          />
          <div className="absolute -right-2 -bottom-12 z-10 md:-right-12 md:bottom-0">
            <ExploreBadge size={136} />
          </div>
        </div>

        <div className="rounded-panel bg-mist-100 px-7 pt-16 pb-10 md:-ml-6 md:min-h-[420px] md:py-16 md:pr-14 md:pl-24">
          <h2 id="story-title" className="font-display text-h1">
            Our story of excellence
          </h2>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-slate-500">
            We connect clients to the world’s finest real estate, from scenic coastal villas to city penthouses. Every listing is visited by
            our own agents, priced with local market data, and backed by partner agencies in 30 countries, so the home you fall for online is
            the home you walk into.
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-6">
            <div>
              <dt className="text-sm text-slate-500">Founded</dt>
              <dd className="mt-1 font-display text-[28px]">2009</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Homes handed over</dt>
              <dd className="mt-1 font-display text-[28px]">4,800+</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
