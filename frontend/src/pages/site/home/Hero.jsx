import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { SearchPill } from '../../../components/site/SearchPill';
import { ease } from '../../../lib/motion';

const HERO = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be';
const src = (w) => `${HERO}?auto=format&fit=crop&w=${w}&q=80`;

const LINES = ['Discover', 'heavenly', 'homes'];

/**
 * The page's one orchestrated moment (DESIGN.md §5):
 *   1. the photo settles from 1.08 → 1, like a camera finishing focus
 *   2. headline lines rise and unblur, 90 ms apart
 *   3. the search pill arrives last
 * On scroll the photo drifts slightly slower than the page for depth.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%']);

  return (
    <section ref={ref} aria-labelledby="hero-title">
      {/* Full-bleed: edge to edge under the fixed navbar */}
      <div className="relative isolate h-svh max-h-[920px] min-h-[600px] overflow-hidden bg-navy-900">
        <motion.div className="absolute inset-0 -z-10" style={{ y }}>
          <motion.img
            src={src(1920)}
            srcSet={`${src(828)} 828w, ${src(1280)} 1280w, ${src(1920)} 1920w, ${src(2560)} 2560w`}
            sizes="100vw"
            alt="A grey shingle family home with white trim on a wide green lawn"
            fetchPriority="high"
            className="size-full object-cover object-[50%_60%]"
            initial={reduce ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: ease.out }}
          />
        </motion.div>
        {/* Gentle scrims keep white text readable on bright skies */}
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-900/45 via-navy-900/0 via-55% to-navy-900/70" aria-hidden />

        <div className="container-page flex h-full flex-col justify-between pt-[120px] pb-8 lg:pt-[150px] lg:pb-12">
          <h1 id="hero-title" className="font-display text-display text-white">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: 24, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.35 + i * 0.09, duration: 0.9, ease: ease.out }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7, ease: ease.out }}
          >
            <p className="max-w-sm text-[17px] leading-relaxed text-white/90">
              Villas, penthouses and family homes in 20 cities, each one visited by the agent who will show it to you.
            </p>
            <SearchPill className="md:max-w-[440px]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
