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
  ChevronDown,
  Factory,
  Shield,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp,
  Wrench,
  Truck,
  CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { ProductCard } from '@/components/b2b/ProductCard';
import { SupplierCard } from '@/components/b2b/SupplierCard';
import { CategoryCard } from '@/components/b2b/CategoryCard';

import { formatNumber, cn, formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbTopSuppliers, setDbTopSuppliers] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchTab, setSearchTab] = useState<'products' | 'manufacturers'>('products');

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
    <div className="min-h-screen bg-slate-50/30 text-slate-900 relative">
      {/* Universal Fixed B2B Brand Background Scene across entire page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Universal Radiant Scene Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: "url('/assets/b2b_landing_bg_scene.jpg')" }}
        />
        {/* Engineering dot matrix texture fixed across the entire viewport */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

        {/* Ambient radiant corner glows */}
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-gradient-to-br from-blue-600/15 via-cyan-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-gradient-to-bl from-orange-500/15 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero search section */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-slate-200/50 z-10">
        <div className="b2b-container max-w-4xl relative z-10">
          {/* Centered Tab Selector */}
          <div className="flex items-center justify-center gap-8 mb-4 text-sm sm:text-base font-bold">
            <button
              type="button"
              onClick={() => setSearchTab('products')}
              className={cn(
                "pb-2 relative transition-colors",
                searchTab === 'products'
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setSearchTab('manufacturers')}
              className={cn(
                "pb-2 relative transition-colors",
                searchTab === 'manufacturers'
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Manufacturers
            </button>
          </div>

          {/* Large Pill Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchTerm.trim()) {
                if (searchTab === 'manufacturers') {
                  navigate(`/suppliers?q=${encodeURIComponent(searchTerm)}`);
                } else {
                  navigate(`/products?q=${encodeURIComponent(searchTerm)}`);
                }
              }
            }}
            className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full border-2 border-primary shadow-lg hover:shadow-xl transition-shadow p-1.5 pl-6"
          >
            <Input
              placeholder={searchTab === 'manufacturers' ? "Search verified manufacturers and factories..." : "What are you looking for today? e.g. solar panels, pumps, valves..."}
              className="h-11 sm:h-12 border-0 bg-transparent text-sm sm:text-base focus-visible:ring-0 text-zinc-900 placeholder:text-zinc-400 pl-0 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              type="submit"
              className="rounded-full h-11 sm:h-12 px-6 sm:px-9 font-bold text-sm uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2 shrink-0"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </form>

          {/* Trending Searches */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-zinc-400">Frequently searched:</span>
            {['Solar Panels', 'Industrial Pumps', 'Copper Wire', 'Safety Gear', 'Packaging Boxes', 'Machinery Valves'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigate(`/products?q=${encodeURIComponent(tag)}`)}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/80 hover:bg-white text-zinc-700 border border-slate-200/60 shadow-2xs transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome bar */}
      <section className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-4 relative z-10">
        <div className="b2b-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">
            Welcome to <span className="font-extrabold text-black">Jumma</span><span className="font-extrabold text-b2b-gst">Baba</span><span className="font-extrabold text-b2b-orange">.com</span>
          </h2>
          <div className="flex items-center gap-6 sm:gap-8 font-semibold text-slate-700">
            <Link to="/products" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Ranking
            </Link>
            <Link to="/suppliers" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Verified Manufacturers
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-shelf discovery grid */}
      <section className="relative overflow-hidden bg-white/40 backdrop-blur-xs py-10 border-b border-slate-200/60 z-10">
        {/* Subtle ambient spots */}
        <div className="absolute -top-12 -right-12 w-[450px] h-[450px] bg-blue-500/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-[450px] h-[450px] bg-primary/4 rounded-full blur-3xl pointer-events-none" />
        <div className="b2b-container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Shelf 1: Categories for you */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-2 border-b border-zinc-100">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">Categories for you</h3>
                </div>
                <div className="space-y-1">
                  {displayCategories.slice(0, 7).map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <span className="truncate">{cat.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                to="/categories"
                className="mt-3 pt-2 border-t border-zinc-100 text-xs font-semibold text-primary hover:underline flex items-center justify-between"
              >
                <span>View all categories</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Shelf 2: Featured Wholesale Spotlight */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Featured Wholesale</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5 mb-2">
                  {latestProducts[0]?.name || 'Industrial Equipment'}
                </h4>
              </div>
              <Link
                to={latestProducts[0] ? `/product/${latestProducts[0].slug}` : '/products'}
                className="my-auto block overflow-hidden rounded-xl bg-slate-50 aspect-square relative"
              >
                <img
                  src={latestProducts[0]?.images?.[0] || latestProducts[0]?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=400&fit=crop'}
                  alt="Featured Product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {latestProducts[0] && (
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    From {formatPrice(latestProducts[0]?.min_price || latestProducts[0]?.minPrice || 450)}
                  </div>
                )}
              </Link>
              <div className="text-[11px] text-muted-foreground pt-2">
                MOQ: {latestProducts[0]?.moq || 10} units
              </div>
            </div>

            {/* Shelf 3: Frequently searched item 1 */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Frequently searched</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5 mb-2">
                  {latestProducts[1]?.name || 'Solar Machinery'}
                </h4>
              </div>
              <Link
                to={latestProducts[1] ? `/product/${latestProducts[1].slug}` : '/products'}
                className="my-auto block overflow-hidden rounded-xl bg-slate-50 aspect-square"
              >
                <img
                  src={latestProducts[1]?.images?.[0] || latestProducts[1]?.image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=400&fit=crop'}
                  alt="Product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <div className="text-[11px] font-semibold text-slate-700 pt-2 flex items-center justify-between">
                <span>Verified Stock</span>
                <span className="text-primary font-bold">Fast Quote</span>
              </div>
            </div>

            {/* Shelf 4: Frequently searched item 2 */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Frequently searched</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5 mb-2">
                  {latestProducts[2]?.name || 'Industrial Pumps'}
                </h4>
              </div>
              <Link
                to={latestProducts[2] ? `/product/${latestProducts[2].slug}` : '/products'}
                className="my-auto block overflow-hidden rounded-xl bg-slate-50 aspect-square"
              >
                <img
                  src={latestProducts[2]?.images?.[0] || latestProducts[2]?.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop'}
                  alt="Product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <div className="text-[11px] font-semibold text-slate-700 pt-2 flex items-center justify-between">
                <span>Ready to Ship</span>
                <span className="text-emerald-600 font-bold">In Stock</span>
              </div>
            </div>

            {/* Shelf 5: Discover New Manufacturers Wide Card */}
            <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/40 border border-emerald-200/60 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mb-2">
                  <ShieldCheck className="h-3 w-3" />
                  Factory Direct
                </span>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug mb-1">
                  Discover new manufacturers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect with GST-audited production facilities across India.
                </p>
              </div>

              <div className="py-4 flex justify-center">
                <div className="h-20 w-full rounded-xl border border-emerald-200/50 bg-white/70 flex items-center justify-center p-2">
                  <div className="flex items-center gap-3">
                    <Factory className="h-7 w-7 text-emerald-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Audited Capacity</p>
                      <p className="text-[10px] text-slate-500">100% Verified GST entities</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  asChild
                  className="rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 h-8 shadow-sm"
                >
                  <Link to="/suppliers">View More</Link>
                </Button>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-4 rounded-full bg-emerald-800"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for your business */}
      <section className="py-12 relative z-10">
        <div className="b2b-container">
          {/* Centered Divider with Brand Gradient */}
          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-slate-200" />
            </div>
            <div className="relative inline-flex items-center gap-2 bg-white px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest border border-slate-200 rounded-full py-1 shadow-2xs">
              <span>Recommended for your business</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">🇮🇳</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pan-India Verified Wholesale Catalog
            </span>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                supplier={product.vendor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Verified Manufacturers Grid */}
      <section className="relative overflow-hidden bg-white/40 backdrop-blur-md py-14 border-y border-slate-200/60 z-10">
        {/* Subtle trust blue ambient halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-blue-600/5 to-indigo-600/4 rounded-full blur-3xl pointer-events-none" />

        <div className="b2b-container relative z-10">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Audited Entity Network
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
                Verified Indian Manufacturers
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Direct connections with verified production facilities and certified suppliers
              </p>
            </div>

            <Link
              to="/suppliers"
              className="text-xs font-bold uppercase tracking-wider text-primary hover:underline hidden sm:flex items-center gap-1"
            >
              View All Suppliers
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayTopSuppliers.slice(0, 6).map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </div>
      </section>

      {/* Trade assurance guarantees */}
      <section className="relative overflow-hidden py-14 border-t border-slate-200/60 z-10">
        {/* Subtle centered spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-blue-500/4 via-primary/4 to-blue-500/4 rounded-full blur-3xl pointer-events-none" />
        <div className="b2b-container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Trade With Confidence
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Protected Wholesale Commerce
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Enterprise safeguards built for high-volume Indian B2B transactions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3.5">
                <ShieldCheck className="h-6 w-6 fill-white text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">100% GST-Audited</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every supplier entity is verified with government GSTIN & business credentials before listing.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-3.5">
                <Shield className="h-6 w-6 fill-white text-emerald-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Payment Protection</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transactions are protected through compliant escrow payment gateways until verified dispatch.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25 mb-3.5">
                <Layers className="h-6 w-6 fill-white text-primary" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Direct Volume Slabs</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Wholesale bulk tier pricing directly from manufacturers with no hidden brokerage markups.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-3.5">
                <Truck className="h-6 w-6 fill-white text-amber-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Pan-India Freight</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear dispatch schedules, GST tax invoices, and tracked cargo logistics across all 28 states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unified partner hub banner */}
      <section className="border-t border-slate-200/60 py-12 relative z-10">
        <div className="b2b-container">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e1b4b] border border-slate-800 shadow-2xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Ambient corner glow */}
            <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -top-16 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 block">
                Wholesale Trade Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                Grow Your Business on <span className="font-extrabold text-white">Jumma</span><span className="font-extrabold text-b2b-gst">Baba</span><span className="font-extrabold text-b2b-orange">.com</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8">
                Connect directly with audited manufacturers across India or expand your factory's nationwide B2B buyer reach with transparent volume slabs.
              </p>
              <div className="flex flex-wrap items-center gap-3.5">
                <Button asChild className="bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-full px-6 h-10 text-xs shadow-sm">
                  <Link to="/register">Register as Buyer</Link>
                </Button>
                <Button asChild className="bg-primary text-white hover:bg-primary/90 font-bold rounded-full px-6 h-10 text-xs shadow-sm">
                  <Link to="/vendor/register">Register as Seller</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium">
                <span>✓ Zero Buyer Membership Fees</span>
                <span>✓ Direct Supplier Messaging</span>
                <span>✓ Official GST Tax Invoices</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}