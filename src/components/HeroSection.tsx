import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroTeam from "@/assets/hero-team.jpg";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('visible');
              }, index * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <img 
          src={heroTeam} 
          alt="Team" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
        <div className="bg-background/70 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-border/50">
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 reveal" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            Find context, not just contacts.
          </h1>
          <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto mb-10 reveal" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Your AI-powered contact memory. Understand who, when, and why you connected—beyond the business card.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 reveal">
            <Button size="lg" className="text-lg px-8 shadow-lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-card/90 backdrop-blur-sm border-2 shadow-lg hover:bg-card" asChild>
              <Link to="/product">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
