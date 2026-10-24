import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  BadgeCheck,
  Award,
  Headphones
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function Footer() {
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setDbCategories(await api.categories.list());
      } catch (e) {
        console.error('Footer cats failed');
      }
    };
    fetchCats();
  }, []);

  const displayCategories = dbCategories.slice(0, 6);
  return (
    <footer className="relative bg-white/60 backdrop-blur-md border-t border-slate-200/80 text-secondary-foreground overflow-hidden z-10">
      {/* Brand accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-slate-900 via-b2b-gst to-primary" />

      {/* Subtle ambient spots */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Trust badges */}
      <div className="border-b border-slate-200/80 bg-white/70 relative z-10 backdrop-blur-xs">
        <div className="b2b-container py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {/* Secure Payments */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="h-7 w-7 text-white fill-white/20" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Secure Payments</p>
                <p className="text-xs text-slate-500">100% Protected</p>
              </div>
            </div>

            {/* Verified Suppliers */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
                <BadgeCheck className="h-7 w-7 text-white fill-white/20" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Verified Suppliers</p>
                <p className="text-xs text-slate-500">GST Registered</p>
              </div>
            </div>

            {/* Quality Assured */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform duration-200">
                <Award className="h-7 w-7 text-white fill-white/20" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Quality Assured</p>
                <p className="text-xs text-slate-500">Trusted Products</p>
              </div>
            </div>

            {/* 24/7 Support */}
            <div className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-200">
                <Headphones className="h-7 w-7 text-white fill-white/20" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">24/7 Support</p>
                <p className="text-xs text-slate-500">Always Available</p>
              </div>
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
              Verified B2B marketplace connecting businesses with trusted manufacturers for direct wholesale sourcing.
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
              <li><Link to="/vendor/register" className="hover:text-primary transition-colors">Sell on <span className="font-bold"><span className="text-black font-extrabold">Jumma</span><span className="text-b2b-gst font-extrabold">Baba</span><span className="text-b2b-orange font-extrabold">.com</span></span></Link></li>
              <li><Link to="/suppliers" className="hover:text-primary transition-colors">Verified Manufacturers</Link></li>
              <li><Link to="/buyer/dashboard" className="hover:text-primary transition-colors">Buyer Dashboard</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-primary transition-colors">Cancellation & Refund Policy</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us & Grievance</Link></li>
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
      <div className="border-t border-slate-200/80 bg-white/60 backdrop-blur-xs">
        <div className="b2b-container py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-secondary-foreground/70">
            <p>© {new Date().getFullYear()} <span className="font-extrabold text-black">Jumma</span><span className="font-extrabold text-b2b-gst">Baba</span><span className="font-extrabold text-b2b-orange">.com</span>. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cancellation-policy" className="hover:text-primary transition-colors">Cancellation & Refund</Link>
              <Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Grievance Redressal</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
