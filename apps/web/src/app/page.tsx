import LandingNav from "@/components/landing/nav";
import Hero from "@/components/landing/hero";
import LogoRow from "@/components/landing/logo-row";
import Steps from "@/components/landing/steps";
import FeaturesSection from "@/components/landing/features";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faq";
import EndCTA from "@/components/landing/end-cta";
import LandingFooter from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      {/* <LogoRow /> */}
      <Steps />
      <FeaturesSection />
      <Pricing />
      <FAQ />
      <EndCTA />
      <LandingFooter />
    </main>
  );
}
