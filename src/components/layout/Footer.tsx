import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
  CheckCircle
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useState, useEffect } from 'react';

export function Footer() {
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories`);
        if (res.ok) setDbCategories(await res.json());
      } catch (e) {
        console.error('Footer cats failed');
      }
    };
    fetchCats();
  }, []);

  const displayCategories = dbCategories.slice(0, 6);
  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Trust badges */}
      <div className="border-b border-secondary-foreground/10">
        <div className="b2b-container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <p className="font-semibold">Secure Payments</p>
              <p className="text-sm text-secondary-foreground/70">100% Protected</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              <p className="font-semibold">Verified Suppliers</p>
              <p className="text-sm text-secondary-foreground/70">GST Registered</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              <p className="font-semibold">Quality Assured</p>
              <p className="text-sm text-secondary-foreground/70">Trusted Products</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Phone className="h-8 w-8 text-primary" />
              <p className="font-semibold">24/7 Support</p>
              <p className="text-sm text-secondary-foreground/70">Always Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="b2b-container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h2 className="mb-4">
              <Logo size="lg" />
            </h2>
            <p className="text-sm text-secondary-foreground/80 mb-4">
              India's leading B2B marketplace connecting buyers with verified suppliers 
              for wholesale and bulk buying.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Top Categories</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              {displayCategories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/vendor/register" className="hover:text-primary transition-colors">Sell on <span className="font-semibold"><span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba</span></Link></li>
              <li><Link to="/post-requirement" className="hover:text-primary transition-colors">Post Requirement</Link></li>
              <li><Link to="/buyer/dashboard" className="hover:text-primary transition-colors">Buyer Dashboard</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>123 Business Hub, Andheri East, Mumbai - 400069, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+91 1800-XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@jummababa.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="b2b-container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/70">
            <p>© {new Date().getFullYear()} JummaBaba.com. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
