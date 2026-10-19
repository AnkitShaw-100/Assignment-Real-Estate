import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { usePublicStats } from '../../../hooks/usePublic';

/** Counts up once when it scrolls into view (DESIGN.md §5). */
function CountUp({ value, format }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || value == null) return undefined;
    if (!inView || reduce) {
      el.textContent = format(reduce || inView ? value : 0);
      return undefined;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, format, reduce]);

  return (
    <span ref={ref} className="tabular" aria-label={value != null ? format(value) : undefined}>
      {format(0)}
    </span>
  );
}

const fmtMoney = (v) => `$${Math.round(v / 1_000_000)}M+`;
const fmtCount = (v) => `${new Intl.NumberFormat('en-US').format(Math.round(v))}+`;
const fmtPct = (v) => `${Math.round(v)}%`;

export function TrustNumbers() {
  const { data } = usePublicStats();
  const stats = [
    { label: 'Total sales volume', value: data?.salesVolume ?? 500_000_000, format: fmtMoney },
    { label: 'Active listings worldwide', value: data?.activeListings ?? 1200, format: fmtCount },
    { label: 'Global partner agencies', value: data?.partnerAgencies ?? 30, format: fmtCount },
    { label: 'Client satisfaction rate', value: data?.satisfaction ?? 98, format: fmtPct },
  ];

  return (
    <section className="px-3 sm:px-4" aria-labelledby="trust-title">
      <div className="rounded-hero bg-navy-900 px-6 py-16 text-white md:py-20">
        <h2 id="trust-title" className="mx-auto max-w-md text-center font-display text-h1">
          We build trust through numbers
        </h2>
        <dl className="container-page mt-12 grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col-reverse items-center gap-2 text-center md:px-4 ${i ? 'md:border-l md:border-white/15' : ''}`}>
              <dt className="text-sm text-white/60">{s.label}</dt>
              <dd className="font-sans text-[40px] leading-none font-medium tracking-[-0.02em] md:text-[48px]">
                <CountUp value={s.value} format={s.format} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
