import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch } from '@/lib/api';
import {
  Search,
  Users,
  Package,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Globe,
  ChevronDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { ProductCard } from '@/components/b2b/ProductCard';
import { SupplierCard } from '@/components/b2b/SupplierCard';
import { CategoryCard } from '@/components/b2b/CategoryCard';

import { formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbTopSuppliers, setDbTopSuppliers] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [publicStats, setPublicStats] = useState<any>({
    products: 0,
    vendors: 0,
    buyers: 0,
    rfqs: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // CATEGORY SCROLL
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        categoryScrollRef.current;

      setCanScrollLeft(scrollLeft > 20);

      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 320;

      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    handleCategoryScroll();

    window.addEventListener('resize', handleCategoryScroll);

    return () =>
      window.removeEventListener('resize', handleCategoryScroll);
  }, [dbCategories]);

  useEffect(() => {
    const fetchHomepageData = async () => {
      setIsLoading(true);

      try {
        const [
          productsResult,
          categoriesResult,
          suppliersResult,
          statsResult
        ] = await Promise.allSettled([
          api.products.list('approved'),
          api.categories.list(),
          apiFetch('/public/suppliers/top'),
          apiFetch('/public/stats')
        ]);

        if (productsResult.status === 'fulfilled') {
          setDbProducts(productsResult.value);
        }

        if (categoriesResult.status === 'fulfilled') {
          setDbCategories(categoriesResult.value);
        }

        if (
          suppliersResult.status === 'fulfilled' &&
          Array.isArray(suppliersResult.value)
        ) {
          setDbTopSuppliers(
            suppliersResult.value.map((s: any) => {
              const docs = s.document_paths || s.documents || {};

              const logo =
                s.logo_url ||
                s.logo ||
                docs.logo ||
                s.business_logo;

              const API_BASE_URL =
                import.meta.env.VITE_API_URL ||
                'http://localhost:3000';

              return {
                ...s,
                companyName:
                  s.business_name ||
                  s.full_name ||
                  'Verified Supplier',

                logo:
                  logo && typeof logo === 'string'
                    ? logo.startsWith('http')
                      ? logo
                      : `${API_BASE_URL}${logo.startsWith('/') ? '' : '/'
                      }${logo}`
                    : 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',

                location: s.location || 'Maharashtra',
                state: s.state || 'India',
                yearEstablished:
                  s.established_year || 2012,

                rating: 4.8,

                totalProducts:
                  Number(s.total_products) || 0,

                gstVerified: true,

                businessType:
                  s.business_type || 'Manufacturer'
              };
            })
          );
        }

        if (statsResult.status === 'fulfilled') {
          const stats = statsResult.value;

          setPublicStats({
            products: Number(stats.products) || 0,
            vendors: Number(stats.vendors) || 0,
            buyers: Number(stats.buyers) || 0,
            rfqs: Number(stats.rfqs) || 0
          });
        }
      } catch (error) {
        console.error(
          'Failed to sync with backend:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const latestProducts = dbProducts;
  const displayCategories = dbCategories;
  const displayTopSuppliers = dbTopSuppliers;

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}

      <section className="relative overflow-hidden border-b bg-white">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-primary/5 to-zinc-50" />
        <div className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="b2b-container relative z-10 py-6 md:py-10">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-24">
            {/* LEFT COLUMN: TEXT & SEARCH */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-[55%] max-w-2xl relative"
            >
              {/* Subtle Decorative Background Element */}
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                <ShieldCheck className="h-3 w-3" />
                Verified Industrial Marketplace
              </div>

              <h1 className="text-3xl md:text-[44px] font-bold tracking-tight leading-[1.1] text-zinc-900 mb-6">
                Your Direct Link to <br /> 
                <span className="text-primary">Verified</span> Wholesale Sourcing
              </h1>

              <p className="text-base md:text-lg leading-relaxed text-zinc-600 mb-6 max-w-lg">
                Empowering businesses with transparent pricing, verified manufacturers, and secure end-to-end logistics.
              </p>

              {/* SIMPLIFIED SEARCH BAR */}
              <div className="group relative flex items-stretch gap-0 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Search products, suppliers..."
                    className="h-11 md:h-12 border-0 bg-transparent pl-11 text-sm md:text-base focus-visible:ring-0 placeholder:text-zinc-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() =>
                    searchTerm.trim() &&
                    navigate(`/products?q=${encodeURIComponent(searchTerm)}`)
                  }
                  className="h-11 md:h-12 rounded-lg px-6 md:px-10 text-sm font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Search className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Search</span>
                </Button>
              </div>

              {/* TRENDING TAGS (Inherited style from original Popular pills) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">Popular:</span>
                {['Solar Panels', 'Industrial Pumps', 'Copper Wire', 'Safety Gear'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/products?q=${encodeURIComponent(tag)}`)}
                    className="text-[11px] font-medium px-3 py-1 rounded-md bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-all border border-zinc-200/50"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* TRUST BADGES ROW */}
              <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-8 text-zinc-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#467ab5]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">GST Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Instant Quotes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Secure Escrow</span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: SQUARE IMAGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:flex w-full lg:w-[35%] justify-center"
            >
              {/* Visual Connector / Background Glow */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-[80px] -z-10" />
              
              <div className="relative aspect-square w-full max-w-[380px] rounded-[32px] overflow-hidden shadow-xl border-4 border-white bg-zinc-50">
                <img
                  src="/assets/b2b-hero.png"
                  alt="Industrial B2B Marketplace"
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Info Card */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md p-3 shadow-lg border border-white/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-primary uppercase tracking-widest mb-0.5">Market Activity</p>
                      <h4 className="text-sm font-bold text-zinc-900">Live Trade Hub</h4>
                    </div>
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center">
                          <Users className="h-3 w-3 text-zinc-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 -bottom-4 -right-4 h-48 w-48 rounded-full bg-orange-500/5 blur-2xl" />
              <div className="absolute -z-10 -top-4 -left-4 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION - PROGRESSIVE GRADIENT & INDUSTRIAL PATTERN */}
      <section className="relative border-b bg-gradient-to-r from-white via-zinc-50/50 to-primary/5 py-8 overflow-hidden">
        {/* Subtle Industrial Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="b2b-container relative z-10">
          <div className="grid grid-cols-4 text-center">
            {/* STATS ITEMS WITH COLORED VALUES & THICKER SEPARATORS */}
            {[
              { label: 'Products', value: publicStats.products, icon: Package, color: 'text-primary' },
              { label: 'Suppliers', value: publicStats.vendors, icon: Users, color: 'text-green-600' },
              { label: 'Buyers', value: publicStats.buyers, icon: Globe, color: 'text-[#467ab5]' },
              { label: 'RFQs', value: publicStats.rfqs, icon: Zap, color: 'text-orange-500' }
            ].map((stat, idx) => (
              <div 
                key={stat.label} 
                className="flex flex-col items-center justify-center text-center px-2 md:px-4 border-r-2 border-zinc-200/60 last:border-0"
              >
                <div className={`mb-1 flex items-center justify-center gap-1 md:gap-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5" />

                  <span className="text-xl md:text-3xl font-bold">
                    {isLoading
                      ? '--'
                      : `${formatNumber(stat.value)}+`}
                  </span>
                </div>

                <p className="text-[9px] md:text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      <section className="bg-white py-10 border-b">
        <div className="b2b-container">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-[30px] font-semibold tracking-tight text-zinc-900">
                Browse Categories
              </h2>

              <div className="mt-2 h-1 w-14 rounded-full bg-primary" />
            </div>

            <Link
              to="/categories"
              className="hidden text-sm font-medium text-primary md:block"
            >
              Explore All
            </Link>
          </div>

          <div className="relative">
            <div
              ref={categoryScrollRef}
              onScroll={handleCategoryScroll}
              className="flex justify-start gap-4 overflow-x-auto scrollbar-hide pb-6 w-full"
            >
              {(displayCategories.length > 8
                ? [
                  ...displayCategories.slice(0, 7),
                  {
                    id: 'view-more',
                    name: 'View More',
                    isViewMore: true
                  }
                ]
                : displayCategories.slice(0, 8)
              ).map((category: any) => (
                <div
                  key={category.id}
                  className="flex justify-center"
                >
                  <CategoryCard category={category} />
                </div>
              ))}
            </div>

            {canScrollLeft && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 top-[calc(50%-12px)] z-20 flex h-11 w-11 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/90 backdrop-blur-sm shadow-lg active:scale-90 transition-all md:hidden"
              >
                <ChevronLeft className="h-6 w-6 text-zinc-700" />
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 top-[calc(50%-12px)] z-20 flex h-11 w-11 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/90 backdrop-blur-sm shadow-lg active:scale-90 transition-all md:hidden"
              >
                <ChevronRight className="h-6 w-6 text-zinc-700" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="bg-white py-10 border-b">
        <div className="b2b-container">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-[30px] font-semibold tracking-tight text-zinc-900">
                Latest Arrivals
              </h2>

              <div className="mt-2 h-1 w-14 rounded-full bg-primary" />
            </div>

            <Link
              to="/products"
              className="text-sm font-medium text-primary"
            >
              Explore All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestProducts
              .slice(0, 8)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  supplier={product.vendor}
                />
              ))}
          </div>
        </div>
      </section>

      {/* RFQ */}

      <section className="bg-white py-5">
        <div className="b2b-container">
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-blue-700 to-primary p-6 md:p-8">
            <div className="relative z-10 grid gap-6 lg:grid-cols-2 items-center">
              <div>
                <Badge className="mb-4 bg-orange-500 text-white border-none">
                  DIRECT SOURCING
                </Badge>

                <h2 className="mb-3 text-2xl md:text-3xl font-semibold text-white">
                  CAN'T FIND WHAT YOU NEED?
                </h2>

                <p className="mb-5 max-w-md text-white/80">
                  Post your requirement and receive
                  quotations directly from verified
                  suppliers.
                </p>

                <Button
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 font-semibold"
                >
                  <Link to="/post-requirement">
                    Post RFQ
                  </Link>
                </Button>
              </div>

              <div className="hidden lg:block">
                <div className="ml-auto max-w-[320px] rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                      <Zap className="h-4 w-4 text-orange-400" />
                    </div>

                    <p className="text-sm font-semibold text-white">
                      Active Marketplace
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2 w-3/4 overflow-hidden rounded-full bg-orange-400/30">
                      <div className="h-full w-2/3 rounded-full bg-orange-400" />
                    </div>

                    <div className="h-2 w-1/2 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPLIERS */}

      <section className="bg-zinc-50 py-12">
        <div className="b2b-container">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-[30px] font-semibold tracking-tight text-zinc-900">
                Verified Suppliers
              </h2>

              <div className="mt-2 h-1 w-14 rounded-full bg-primary" />
            </div>

            <Link
              to="/suppliers"
              className="text-sm font-medium text-primary"
            >
              View All Suppliers
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayTopSuppliers
              .slice(0, 6)
              .map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                />
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="border-t bg-white py-12">
        <div className="b2b-container">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-zinc-950 p-10 text-white">
              <h3 className="mb-4 text-2xl md:text-3xl font-semibold tracking-tight">
                Are You a Buyer?
              </h3>

              <p className="mb-8 text-zinc-400 leading-relaxed">
                Join verified buyers and connect with
                trusted suppliers across India.
              </p>

              <Button
                asChild
                className="bg-white text-black hover:bg-zinc-100 font-semibold"
              >
                <Link to="/register">
                  Register as Buyer
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl bg-primary p-10 text-white">
              <h3 className="mb-4 text-2xl md:text-3xl font-semibold tracking-tight">
                Are You a Supplier?
              </h3>

              <p className="mb-8 text-primary-foreground/80 leading-relaxed">
                Showcase your products and reach
                high-intent buyers directly.
              </p>

              <Button
                asChild
                className="bg-white text-primary hover:bg-zinc-100 font-semibold"
              >
                <Link to="/vendor/register">
                  Register as Seller
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}