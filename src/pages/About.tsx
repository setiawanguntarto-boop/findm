import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Network, Lock, Sparkles } from "lucide-react";

const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      const elements = sectionRef.current.querySelectorAll('.reveal');
      elements.forEach((el) => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);

  const values = [
    {
      icon: Network,
      title: "Connection",
      description: "We believe in building bridges, not walls. Our platform is designed to foster meaningful connections.",
    },
    {
      icon: Sparkles,
      title: "Simplicity",
      description: "We make the complex simple. Great technology should feel invisible and intuitive.",
    },
    {
      icon: Lock,
      title: "Trust & Privacy",
      description: "Your trust is our most important asset. We are committed to protecting your data and your privacy.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-grow pt-16">
          {/* Hero Section */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <motion.header 
              className="text-center mb-20 md:mb-32"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                We help you connect the dots.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                At find.me, we believe in the power of connection. We're building the tools to help you discover the people, opportunities, and information that matter most to you, seamlessly and securely.
              </p>
            </motion.header>

            {/* Our Mission Section */}
            <section 
              ref={sectionRef}
              className="bg-card rounded-xl shadow-md overflow-hidden mb-20 md:mb-32 border border-border"
            >
              <div className="md:flex">
                {/* Image side */}
                <motion.div 
                  className="md:w-1/2"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <img 
                    className="h-64 w-full object-cover md:h-full" 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" 
                    alt="Team collaboration representing our mission"
                  />
                </motion.div>
                {/* Text side */}
                <motion.div 
                  className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center reveal"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Mission</h2>
                  <h3 className="text-3xl font-bold text-foreground mb-4">To Make Discovery Simple</h3>
                  <p className="text-muted-foreground text-base mb-4">
                    The world is full of noise. Our mission is to cut through it. We're dedicated to creating intuitive and powerful tools that simplify discovery.
                  </p>
                  <p className="text-muted-foreground text-base">
                    Whether you're looking for a new career path, reconnecting with an old friend, or finding a local service, find.me is your trusted partner in navigating the digital world.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* Our Values Section */}
            <motion.section 
              className="bg-muted rounded-xl p-8 md:p-16 border border-border"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">Our Core Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <motion.div
                      key={value.title}
                      className="flex items-start group"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="flex-shrink-0 mr-4 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2 text-foreground">{value.title}</h4>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default About;
