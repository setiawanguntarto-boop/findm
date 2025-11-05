import Navigation from "@/components/Navigation";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const UseCases = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <UseCasesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default UseCases;
