import { useEffect, useRef, useState } from "react";
import { Search, ChevronRight } from "lucide-react";

const searchExamples = [
  {
    query: "Who did I meet at the Bandung event?",
    results: [
      {
        name: "Marcus Chen",
        role: "CEO, AquaTech Solutions",
        context: "Discussed aquaculture tech partnerships. Interested in IoT sensors for fish farms. Follow up in 2 weeks.",
        meetingDate: "Nov 15, 2024",
        initials: "MC"
      },
      {
        name: "Sarah Williams",
        role: "Marketing Director, AquaTech Solutions",
        context: "Shared marketing case study. Mentioned they're expanding to Southeast Asia. Great for referral program.",
        meetingDate: "Nov 15, 2024",
        initials: "SW"
      }
    ]
  },
  {
    query: "Who mentioned funding opportunities?",
    results: [
      {
        name: "David Park",
        role: "VC Partner, TechVentures",
        context: "Looking for Series A startups in fintech. Mentioned $5M-$10M range. Our product fits their thesis.",
        meetingDate: "Oct 28, 2024",
        initials: "DP"
      }
    ]
  },
  {
    query: "Who works at eFishery?",
    results: [
      {
        name: "Alexandra Rodriguez",
        role: "Product Manager, eFishery",
        context: "Met at startup summit. Discussed integration possibilities. Very interested in our API.",
        meetingDate: "Nov 10, 2024",
        initials: "AR"
      }
    ]
  }
];

const AIContextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('visible');
              }, index * 200);
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

  const currentExample = searchExamples[currentExampleIndex];

  const cycleExample = () => {
    setCurrentExampleIndex((prev) => (prev + 1) % searchExamples.length);
  };

  return (
    <section ref={sectionRef} className="py-24 bg-muted border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">
              Your digital brain for human context.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Find.me uses vector memory and AI reasoning to recall human connections, not just data points. We understand relationships, conversation tones, and shared history.
            </p>
            <a href="#" className="text-lg font-medium text-accent hover:text-accent/80 transition-colors">
              Learn how our AI works →
            </a>
          </div>

          <div className="reveal">
            <div className="relative bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center space-x-3 bg-muted p-3 rounded-lg border border-border mb-4">
                <Search className="w-5 h-5 text-accent" />
                <p className="text-muted-foreground flex-1">{currentExample.query}</p>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Find.me recalls {currentExample.results.length} {currentExample.results.length === 1 ? 'person' : 'people'}:
                </p>
                {currentExample.results.map((result, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start space-x-3 bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0">
                      {result.initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary">{result.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{result.role}</p>
                      <p className="text-xs text-muted-foreground italic line-clamp-2">{result.context}</p>
                      <p className="text-xs text-muted-foreground mt-1">Met: {result.meetingDate}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={cycleExample}
                className="w-full mt-4 text-sm text-accent hover:text-accent/80 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Try another search
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/10 rounded-full filter blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIContextSection;
