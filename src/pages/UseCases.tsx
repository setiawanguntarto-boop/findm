import Navigation from "@/components/Navigation";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const UseCases = () => {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16">
          <UseCasesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default UseCases;
