import { ExploreBadge } from '../../../components/site/ExploreBadge';
import { FadeImage } from '../../../components/ui/FadeImage';
import { Globe, Handshake, Key } from '../../../components/ui/icons';

const MAIN = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80';
const INSET = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80';

const VALUES = [
  { icon: Key, title: 'Every home visited', text: 'Our agents walk through each listing before it goes live, so the photos match the place.' },
  { icon: Handshake, title: 'One agent, start to finish', text: 'The person who answers your first call is the one who hands you the keys.' },
  { icon: Globe, title: 'Local partners in 30 countries', text: 'Market data and legal know-how from agencies who live where you’re buying.' },
];

const STATS = [
  { label: 'Founded', value: '2009' },
  { label: 'Homes handed over', value: '4,800+' },
  { label: 'Client rating', value: '4.9/5' },
];

export function Story() {
  return (
    <section className="container-page py-20 md:py-28" aria-labelledby="story-title">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
        {/* Photo collage: main shot with an inset interior and the badge */}
        <div className="relative pb-16 sm:pr-16">
          <FadeImage
            className="aspect-[4/5] w-full rounded-panel sm:aspect-[4/4.4]"
            src={`${MAIN}&w=1000`}
            srcSet={`${MAIN}&w=640 640w, ${MAIN}&w=1000 1000w`}
            sizes="(min-width: 1024px) 45vw, 100vw"
            alt="House keys resting beside a small model home"
          />
          <FadeImage
            className="absolute right-0 bottom-0 hidden aspect-[4/3] w-[52%] rounded-card border-[6px] border-paper shadow-lift sm:block"
            src={`${INSET}&w=600`}
            alt="A bright, furnished living room"
          />
          <ExploreBadge size={120} className="absolute top-6 left-6 shadow-float" />
        </div>

        <div>
          <h2 id="story-title" className="font-display text-h1">
            Our story of excellence
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-slate-500">
            Since 2009 we’ve connected people with homes they love, from coastal villas to city penthouses, and handled everything in between so
            the home you fall for online is the home you walk into.
          </p>

          <ul className="mt-9 space-y-6">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist-100 text-accent-600">
                  <Icon className="size-[22px]" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-slate-500">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-10 grid grid-cols-3 divide-x divide-line rounded-card border border-line">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-4 sm:px-6">
                <dd className="font-display text-[26px] leading-none tabular">{s.value}</dd>
                <dt className="mt-2 text-[13px] text-slate-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
