import logoFull from "@/assets/logo-full.png";

const Footer = () => {
  return (
    <footer className="py-20 bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <img src={logoFull} alt="find.me" className="h-6 mb-4" />
            <p className="text-sm text-muted-foreground">
              Beyond contacts — remember the context.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="/product" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">How It Works</a></li>
              <li><a href="/use-cases" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Use Cases</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Pricing</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Download</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">About Us</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Blog</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Find.me — All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
