import { useEffect, useRef } from "react";
import { Camera, Sparkles, Search } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "1. Capture",
    description: "Upload a business card, forward a WhatsApp chat, or sync your meeting notes.",
  },
  {
    icon: Sparkles,
    title: "2. Understand",
    description: "AI reads and extracts names, companies, key topics, and shared memories.",
  },
  {
    icon: Search,
    title: "3. Recall",
    description: 'Ask in plain English: "Who did I meet at the aquaculture summit last month?"',
  },
];

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('visible');
              }, index * 150);
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
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 reveal">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground reveal">
            3 simple steps to build your contextual memory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 reveal"
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
