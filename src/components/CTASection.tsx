import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
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
    <section ref={sectionRef} className="py-24 bg-primary text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-8 reveal">
          Start remembering who matters.
        </h2>
        <Button size="lg" variant="secondary" className="px-8 text-lg reveal" asChild>
          <a href="/auth">Get Started — It's Free</a>
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
