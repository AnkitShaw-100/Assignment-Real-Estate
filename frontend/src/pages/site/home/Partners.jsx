// Partner agencies strip from the mockup. Simple glyph + wordmark pairs,
// monochrome navy at 70% that sharpen on hover (DESIGN.md §7).
const PARTNERS = [
  { name: 'monaco', glyph: <rect x="2" y="5" width="14" height="10" rx="2" /> },
  { name: 'delaware', glyph: <path d="M3 4h7a6 6 0 0 1 0 12H3z" /> },
  { name: 'Amsterdam', glyph: <circle cx="9" cy="10" r="6" /> },
  { name: 'umbrella', glyph: <path d="M2 10a7 7 0 0 1 14 0zM9 10v5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" /> },
  { name: 'sweden', glyph: <path d="M9 3c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7zm0 3a4 4 0 1 0 0 8z" /> },
  { name: 'Springfield', glyph: <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z" /> },
];

export function Partners() {
  return (
    <section className="px-3 sm:px-4" aria-label="Partner agencies">
      <div className="-mt-px rounded-b-panel bg-mist-100 py-7">
        <ul className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:justify-between">
          {PARTNERS.map((p) => (
            <li key={p.name} className="flex items-center gap-2 text-navy-900/70 transition-colors duration-300 hover:text-navy-900">
              <svg viewBox="0 0 18 20" className="h-5 w-[18px]" fill="currentColor" aria-hidden>
                {p.glyph}
              </svg>
              <span className="text-[19px] font-semibold tracking-[-0.02em]">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
