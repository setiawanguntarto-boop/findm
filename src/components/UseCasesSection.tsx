import { useEffect, useRef } from "react";
import { DollarSign, Users, Rocket } from "lucide-react";

const useCases = [
  {
    icon: DollarSign,
    title: "Sales & CRM",
    description: "Track prospect details and recall key personal moments from past conversations instantly.",
  },
  {
    icon: Users,
    title: "Recruiters & HR",
    description: "Manage candidate pipelines and remember personal details from every interview.",
  },
  {
    icon: Rocket,
    title: "Founders & Events",
    description: "Met 50 people at a conference? Find.me remembers all of them and why you connected.",
  },
];

const UseCasesSection = () => {
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
    <section id="use-cases" ref={sectionRef} className="py-24 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 reveal">
            Designed for professionals who network smarter.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 reveal"
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
