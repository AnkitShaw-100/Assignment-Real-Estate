import { Button } from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-24 text-center">
      <div>
        <p className="font-display text-[120px] leading-none text-mist-200">404</p>
        <h1 className="mt-2 font-display text-h1">This page has moved out</h1>
        <p className="mx-auto mt-4 max-w-sm text-slate-500">The link may be old, or the listing may have been sold. Let’s find you somewhere new.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/properties">Browse properties</Button>
          <Button to="/" variant="secondary">
            Go home
          </Button>
        </div>
      </div>
    </section>
  );
}
