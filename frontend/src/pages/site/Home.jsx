import { Hero } from './home/Hero';
import { Partners } from './home/Partners';
import { Story } from './home/Story';
import { PopularListings } from './home/PopularListings';
import { TrustNumbers } from './home/TrustNumbers';
import { FeaturedHomes } from './home/FeaturedHomes';
import { Testimonial } from './home/Testimonial';
import { CallToAction } from './home/CallToAction';
import { usePageTitle } from '../../hooks/usePageTitle';

// Section order follows docs/reference/homepage-mockup.webp top to bottom.
export default function Home() {
  usePageTitle('Discover heavenly homes');
  return (
    <>
      <Hero />
      <Partners />
      <Story />
      <PopularListings />
      <TrustNumbers />
      <FeaturedHomes />
      <Testimonial />
      <CallToAction />
    </>
  );
}
