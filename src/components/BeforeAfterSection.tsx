import { useEffect, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

const BeforeAfterSection = () => {
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
    <section ref={sectionRef} className="py-24 bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 reveal">
            Before Find.me vs. After Find.me
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Before */}
          <div className="bg-card rounded-xl p-8 border-2 border-destructive/20 reveal">
            <div className="flex items-center gap-2 mb-6">
              <X className="w-6 h-6 text-destructive" />
              <h3 className="text-2xl font-bold text-destructive">Without Find.me</h3>
            </div>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span>Spend 10+ minutes searching emails and notes for one contact</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span>Forget 60% of conversation details within 2 weeks</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span>Miss follow-up opportunities because you can't remember context</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span>Struggle to personalize follow-ups without context</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span>Lose track of contacts from events and conferences</span>
              </li>
            </ul>
          </div>

          {/* After */}
          <div className="bg-card rounded-xl p-8 border-2 border-primary/20 reveal">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-primary">With Find.me</h3>
            </div>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Find any contact in seconds</strong> with natural language search</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Remember 87% more details</strong> with AI-powered context extraction</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Never miss a follow-up</strong> with instant context recall</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Personalize every interaction</strong> with conversation history and shared memories</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Turn every event into opportunities</strong> with complete contact memory</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mt-12 bg-primary/5 rounded-xl p-8 border border-primary/20 text-center reveal">
          <h3 className="text-2xl font-bold text-primary mb-4">
            Calculate Your Time Savings
          </h3>
          <p className="text-muted-foreground mb-6">
            If you manage 100 contacts and spend 5 minutes finding context per contact:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div>
              <div className="text-4xl font-bold text-destructive">8.3 hours</div>
              <div className="text-sm text-muted-foreground">Time wasted per month</div>
            </div>
            <div className="text-2xl">→</div>
            <div>
              <div className="text-4xl font-bold text-primary">2 minutes</div>
              <div className="text-sm text-muted-foreground">With Find.me</div>
            </div>
            <div className="text-2xl">=</div>
            <div>
              <div className="text-4xl font-bold text-primary">8+ hours saved</div>
              <div className="text-sm text-muted-foreground">Every month</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;

