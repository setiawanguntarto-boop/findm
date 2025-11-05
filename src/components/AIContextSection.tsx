import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

const AIContextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

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
                <p className="text-muted-foreground">Who did I meet at the Bandung event?</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Find.me recalls 2 people:</p>
                <div className="flex items-center space-x-3 bg-card p-3 rounded-lg border border-border shadow-sm">
                  <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                    GH
                  </span>
                  <div>
                    <p className="font-bold text-primary">Gibran Huzaifah</p>
                    <p className="text-sm text-muted-foreground">CEO, eFishery</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-card p-3 rounded-lg border border-border shadow-sm">
                  <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-sm">
                    AP
                  </span>
                  <div>
                    <p className="font-bold text-primary">Andri Pratama</p>
                    <p className="text-sm text-muted-foreground">Marketing Lead, eFishery</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/10 rounded-full filter blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIContextSection;
