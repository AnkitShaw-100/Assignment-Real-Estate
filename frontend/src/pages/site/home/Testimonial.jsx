import { motion } from 'motion/react';
import { ease } from '../../../lib/motion';

const IMG = 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&q=80';

export function Testimonial() {
  return (
    <section className="container-page pb-24 md:pb-32" aria-labelledby="testimonial-title">
      <div className="rounded-panel bg-mist-100 px-6 py-14 md:px-16 md:py-20">
        <h2 id="testimonial-title" className="text-center font-display text-h1">
          What our clients say
        </h2>

        <figure className="mt-12 grid items-center gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <blockquote className="max-w-[54ch] text-[18px] leading-[1.75] text-slate-500 md:text-[19px]">
              “Working with this team was unlike any real estate experience we’ve had. Their professionalism, global perspective and dedication
              made finding our dream home effortless. Every detail, from the first call to the day we got the keys, was handled with care.”
            </blockquote>
            <figcaption className="mt-8 font-semibold">Alexander and Emilia R., Monaco</figcaption>
          </div>

          <div className="relative mx-auto w-full max-w-[300px]">
            <motion.img
              src={`${IMG}&w=700`}
              alt="A smiling father carrying his two young children outside their home"
              loading="lazy"
              className="aspect-square w-full rounded-full object-cover"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.8, ease: ease.out }}
            />
            <span className="absolute bottom-[6%] left-[2%] grid size-14 place-items-center rounded-full bg-brass-400 text-navy-900 shadow-float" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                <path d="M4 17.5V13c0-3.6 1.6-6.3 4.8-8l1 1.6C7.9 7.8 7 9.3 6.9 11.2H10v6.3H4Zm9.5 0V13c0-3.6 1.6-6.3 4.8-8l1 1.6c-1.9 1.2-2.8 2.7-2.9 4.6h3.1v6.3h-6Z" />
              </svg>
            </span>
          </div>
        </figure>
      </div>
    </section>
  );
}
