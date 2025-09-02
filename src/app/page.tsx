"use client";

import { SiteLayout } from '@/components/layout/site-layout';
import { Hero } from '@/components/layout/hero';
import { Features } from '@/components/layout/features';
import { Pricing } from '@/components/layout/pricing';
import { FAQ } from '@/components/layout/faq';
import { CTA } from '@/components/layout/cta';
import { Testimonials } from '@/components/layout/testimonials';

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </SiteLayout>
  );
}
