import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <Navigation />
        <main>
          <HeroSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
