import { useEffect, useRef } from "react";
import { TrendingUp, Clock, Users, Zap } from "lucide-react";

const metrics = [
  {
    icon: TrendingUp,
    value: "3x",
    label: "Better follow-up rate",
    description: "Users who recall context follow up 3x more often than those relying on memory alone"
  },
  {
    icon: Clock,
    value: "5 min",
    label: "Time saved per contact",
    description: "No more digging through emails or notes—find context in seconds"
  },
  {
    icon: Users,
    value: "87%",
    label: "Remember more connections",
    description: "Users report remembering details about 87% more contacts after 30 days"
  },
  {
    icon: Zap,
    value: "2.5x",
    label: "Faster relationship building",
    description: "Contextual recall helps build rapport faster in follow-up conversations"
  }
];

const realWorldExamples = [
  {
    scenario: "Sales Professional",
    problem: "Met 50 prospects at a conference, forgot who discussed what",
    solution: "Searched 'aquaculture summit Jakarta' and instantly recalled all 12 relevant contacts with conversation notes",
    result: "Closed 3 deals worth $150K by following up with precise context"
  },
  {
    scenario: "Event Organizer",
    problem: "Can't remember which speaker mentioned partnership opportunities",
    solution: "Asked 'Who mentioned partnerships at Bandung event?'",
    result: "Identified 5 potential partners and initiated 3 successful collaborations"
  },
  {
    scenario: "Recruiter",
    problem: "Lost track of candidate details from multiple interviews",
    solution: "Searched by company, role, or interview topics to find candidates instantly",
    result: "Reduced time-to-fill by 40% and improved candidate experience"
  }
];

const ImpactSection = () => {
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
    <section ref={sectionRef} className="py-24 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 reveal">
            Real Results from Real Users
          </h2>
          <p className="text-lg text-muted-foreground reveal">
            See how contextual memory transforms how professionals build relationships
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-muted rounded-xl p-6 border border-border hover:shadow-lg transition-all reveal"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="text-sm font-semibold text-foreground mb-2">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
              </div>
            );
          })}
        </div>

        {/* Real-World Examples */}
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-primary text-center mb-12 reveal">
            How Professionals Use Find.me
          </h3>
          
          {realWorldExamples.map((example, index) => (
            <div
              key={index}
              className="bg-muted rounded-xl p-8 border border-border reveal"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {example.scenario}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">The Challenge:</p>
                      <p className="text-foreground">{example.problem}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Find.me Solution:</p>
                      <p className="text-foreground italic">"{example.solution}"</p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-semibold text-primary mb-1">The Result:</p>
                      <p className="text-foreground font-medium">{example.result}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;

