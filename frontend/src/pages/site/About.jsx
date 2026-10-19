import { motion } from 'motion/react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Button } from '../../components/ui/Button';
import { clipReveal } from '../../lib/motion';

const IMG = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80';

// How a sale works with Niwas: a real sequence, so the steps are numbered
const STEPS = [
  { title: 'Tell us what home means to you', body: 'A first call with an agent about budget, areas and the things you can’t live without.' },
  { title: 'See homes we’ve already walked through', body: 'Every shortlist comes from homes our agents have visited in person, with honest notes.' },
  { title: 'Visit, compare, decide', body: 'We arrange viewings around your schedule, in person or by video, and help you weigh them up.' },
  { title: 'Get the keys', body: 'Offer, negotiation, paperwork and the handover, handled by the same agent from start to finish.' },
];

export default function About() {
  usePageTitle('About us');
  return (
    <>
      <section className="container-page grid gap-12 pt-14 pb-20 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <h1 className="font-display text-display">Homes, handled by people who know them</h1>
          <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-slate-500">
            Niwas started in 2009 with a simple rule: never list a home we haven’t stood inside. Today our agents and partner agencies cover 30
            countries, and the rule hasn’t changed.
          </p>
        </div>
        <motion.img {...clipReveal} src={`${IMG}&w=1200`} alt="Two Niwas agents celebrating a closed sale at the office" className="aspect-[4/3] w-full rounded-panel object-cover" />
      </section>

      <section className="bg-mist-100 py-20 md:py-28" aria-labelledby="how-title">
        <div className="container-page">
          <h2 id="how-title" className="max-w-md font-display text-h1">
            How buying with us works
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t border-navy-900/15 pt-6">
                <span className="font-display text-[40px] leading-none text-brass-700">{i + 1}</span>
                <h3 className="mt-5 font-display text-h3">{s.title}</h3>
                <p className="mt-3 text-slate-500">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page flex flex-col items-start gap-6 py-20 md:flex-row md:items-center md:justify-between md:py-28">
        <h2 className="max-w-lg font-display text-h1">Ready to start looking?</h2>
        <div className="flex gap-3">
          <Button to="/properties">Browse properties</Button>
          <Button to="/contact" variant="secondary">
            Talk to an agent
          </Button>
        </div>
      </section>
    </>
  );
}
