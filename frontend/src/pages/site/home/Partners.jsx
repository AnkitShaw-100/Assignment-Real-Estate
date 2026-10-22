// Partner agencies strip. Each partner has a logomark and a two-line
// wordmark, monochrome navy that sharpens on hover (DESIGN.md §7).
// These are fictional demo agencies; real brands' logos would imply
// partnerships that don't exist.
const PARTNERS = [
  {
    name: 'Monaco',
    descriptor: 'Estates',
    mark: <path d="M4 24V11l6 5 6-9 6 9 6-5v13zM4 26h24v2H4z" />,
  },
  {
    name: 'Delaware',
    descriptor: 'Realty',
    mark: <path fillRule="evenodd" d="M9 3h14a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6zm3 7v12h4a6 6 0 0 0 0-12z" />,
  },
  {
    name: 'Amsterdam',
    descriptor: 'Living',
    mark: <path d="M3 28V14l4-5 4 5v14zM12 28V10l4-6 4 6v18zM21 28V14l4-5 4 5v14z" />,
  },
  {
    name: 'Umbrella',
    descriptor: 'Homes',
    mark: <path d="M3 15a13 11 0 0 1 26 0zM8 17h16v11h-6v-6h-4v6H8z" />,
  },
  {
    name: 'Nordic',
    descriptor: 'Property group',
    mark: <path d="M2 27 12 8l10 19zM16 27l7-13 7 13z" />,
  },
  {
    name: 'Springfield',
    descriptor: 'Partners',
    mark: <path d="M15 29V16C15 9 10 5 3 5c0 7 4 11 12 11M17 29V19c0-6 4-10 12-10 0 6-4 10-12 10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  },
];

export function Partners() {
  return (
    <section className="border-b border-line bg-mist-100" aria-label="Partner agencies">
      <ul className="container-page grid grid-cols-2 items-center gap-x-6 gap-y-7 py-9 sm:grid-cols-3 lg:flex lg:justify-between">
        {PARTNERS.map((p) => (
          <li key={p.name} className="flex items-center gap-3 text-navy-900/60 transition-colors duration-300 hover:text-navy-900">
            <svg viewBox="0 0 32 32" className="size-8 shrink-0" fill="currentColor" aria-hidden>
              {p.mark}
            </svg>
            <span className="flex flex-col leading-none">
              <span className="text-[19px] font-semibold tracking-[-0.03em]">{p.name}</span>
              <span className="mt-1 text-[10px] font-medium tracking-[0.22em] uppercase">{p.descriptor}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
