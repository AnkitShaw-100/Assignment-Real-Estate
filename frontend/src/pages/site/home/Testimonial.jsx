import { Quotes, StarFill } from '../../../components/ui/icons';
import { FadeImage } from '../../../components/ui/FadeImage';

const IMG = 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&q=80';
const avatar = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=160&h=160&q=70`;

const REVIEWS = [
  {
    quote: 'We were relocating from London with two weeks to find a flat. Our agent shortlisted five places that actually matched our brief, did video tours for each, and had the lease signed before we landed.',
    name: 'Sara M.',
    place: 'Rented in Lisbon',
    photo: avatar('1580489944761-15a19d654956'),
  },
  {
    quote: 'I was selling my first commercial unit and had no idea where to start. They priced it honestly, handled every viewing and kept me updated at each step. It sold above asking in under a month.',
    name: 'Rohan K.',
    place: 'Sold an office in Bengaluru',
    photo: avatar('1507003211169-0a1dd7228f2d'),
  },
];

function Stars() {
  return (
    <span className="flex gap-0.5 text-accent-500" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarFill key={i} className="size-4" aria-hidden />
      ))}
    </span>
  );
}

export function Testimonial() {
  return (
    <section className="container-page pb-24 md:pb-32" aria-labelledby="testimonial-title">
      <div className="rounded-panel bg-mist-100 px-6 py-14 md:px-16 md:py-20">
        <h2 id="testimonial-title" className="text-center font-display text-h1">
          What our clients say
        </h2>

        <figure className="mt-12 grid items-center gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <Stars />
            <blockquote className="mt-5 max-w-[54ch] text-[18px] leading-[1.75] text-slate-500 md:text-[19px]">
              “Working with this team was unlike any real estate experience we’ve had. Their professionalism, global perspective and dedication
              made finding our dream home effortless. Every detail, from the first call to the day we got the keys, was handled with care.”
            </blockquote>
            <figcaption className="mt-8">
              <span className="block font-semibold">Alexander and Emilia R.</span>
              <span className="text-sm text-slate-500">Bought a villa in Monaco</span>
            </figcaption>
          </div>

          <div className="relative mx-auto w-full max-w-[300px]">
            <FadeImage className="aspect-square w-full rounded-full" src={`${IMG}&w=700`} alt="A smiling father carrying his two young children outside their home" />
            <span className="absolute bottom-[6%] left-[2%] grid size-14 place-items-center rounded-full bg-accent-500 text-white shadow-float" aria-hidden>
              <Quotes className="size-6" />
            </span>
          </div>
        </figure>

        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {REVIEWS.map((r) => (
            <li key={r.name}>
              <figure className="flex h-full flex-col rounded-card bg-paper p-6 md:p-7">
                <Stars />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-500">“{r.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <FadeImage className="size-11 shrink-0 rounded-full" src={r.photo} alt="" />
                  <span>
                    <span className="block font-semibold">{r.name}</span>
                    <span className="text-sm text-slate-500">{r.place}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
