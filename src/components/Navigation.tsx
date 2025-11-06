import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoFull from "@/assets/logo-full.png";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0" aria-label="Find.me Homepage">
            <img src={logoFull} alt="find.me" className="h-24" />
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/product" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Product
            </Link>
            <Link to="/use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background shadow-lg border-b border-border">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link to="/product" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              Product
            </Link>
            <Link to="/use-cases" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              Use Cases
            </Link>
            <Link to="/about" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="#" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
          </div>
          <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
            <Button className="w-full" asChild>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
