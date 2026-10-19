import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { InquiryForm } from '../../components/site/InquiryForm';

const DETAILS = [
  { icon: Phone, label: 'Call us', value: '+1 415 555 0100', href: 'tel:+14155550100' },
  { icon: Mail, label: 'Email', value: 'hello@niwas.app', href: 'mailto:hello@niwas.app' },
  { icon: MapPin, label: 'Visit', value: '200 Market Street, San Francisco' },
  { icon: Clock, label: 'Hours', value: 'Monday to Saturday, 9am to 7pm' },
];

export default function Contact() {
  usePageTitle('Contact');
  return (
    <section className="container-page grid gap-14 pt-14 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:pt-20">
      <div>
        <h1 className="font-display text-display">Let’s talk</h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-slate-500">
          Tell us what you’re looking for and an agent will reply within one working day. No pressure, no newsletters.
        </p>
        <dl className="mt-12 grid gap-8 sm:grid-cols-2">
          {DETAILS.map(({ icon: Icon, label, value, href }) => (
            <div key={label}>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <Icon className="size-4" strokeWidth={1.5} />
                {label}
              </dt>
              <dd className="mt-1.5 font-medium">{href ? <a href={href} className="hover:underline">{value}</a> : value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-panel bg-mist-100 p-6 md:p-10">
        <h2 className="mb-6 font-display text-h2">Send us a message</h2>
        <InquiryForm />
      </div>
    </section>
  );
}
