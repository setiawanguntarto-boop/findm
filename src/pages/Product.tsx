import Navigation from "@/components/Navigation";
import HowItWorksSection from "@/components/HowItWorksSection";
import AIContextSection from "@/components/AIContextSection";
import ImpactSection from "@/components/ImpactSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Product = () => {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16">
          <HowItWorksSection />
          <AIContextSection />
          <ImpactSection />
          <BeforeAfterSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Product;
