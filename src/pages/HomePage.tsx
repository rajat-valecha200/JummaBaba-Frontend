import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Package, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/b2b/ProductCard';
import { SupplierCard } from '@/components/b2b/SupplierCard';
import { CategoryCard } from '@/components/b2b/CategoryCard';
import { formatNumber } from '@/lib/utils';
import { UnderConstructionModal } from '@/components/ui/UnderConstructionModal';

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
  const [constructionOpen, setConstructionOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');

  const openConstruction = (name: string) => {
    setFeatureName(name);
    setConstructionOpen(true);
  };
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.list('approved');
        if (data && data.length > 0) {
          setDbProducts(data.map((p: any) => {
            const pricingSlabs = typeof p.pricing_slabs === 'string' 
              ? JSON.parse(p.pricing_slabs) 
              : p.pricing_slabs;
            
            const minPrice = pricingSlabs && pricingSlabs.length > 0 
              ? pricingSlabs[0].pricePerUnit 
              : 0;

            return {
              ...p,
              shortDescription: p.short_description,
              supplierId: p.supplier_id,
              minPrice: minPrice,
              images: p.images?.length > 0 ? p.images : ['https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600']
            };
          }));
        }
      } catch (error) {
        console.error('Failed to fetch from custom API:', error);
      }
    };
    fetchProducts();

    const fetchDependencies = async () => {
      setIsLoading(true);
      try {
        // Fetch Categories
        const catRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setDbCategories(catData);
        }

        // Fetch Top Suppliers
        const supRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/suppliers/top`);
        if (supRes.ok) {
          const supData = await supRes.json();
          setDbTopSuppliers(supData.map((s: any) => ({
            ...s,
            companyName: s.business_name || s.full_name,
            logo: s.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
            location: s.location || 'Maharashtra',
            state: s.state || 'India',
            yearEstablished: 2012,
            rating: 4.8,
            totalProducts: 150,
            gstVerified: true,
            businessType: 'Manufacturer'
          })));
        }

        // Fetch Stats with robust fallback
        const statsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/stats/public`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPublicStats({
            products: Number(statsData.products) || 0,
            vendors: Number(statsData.vendors) || 0,
            buyers: Number(statsData.buyers) || 0,
            rfqs: Number(statsData.rfqs) || 0,
          });
        }
      } catch (error) {
        console.error('Failed to sync with backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    fetchDependencies();
  }, []);

  const latestProducts = dbProducts;
  
  const displayCategories = dbCategories;
  
  const displayTopSuppliers = dbTopSuppliers;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-secondary to-b2b-navy text-secondary-foreground py-12 md:py-20">
        <div className="b2b-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {user ? (
                <>Welcome back, <span className="text-primary">{user.full_name || user.email.split('@')[0]}</span>!</>
              ) : (
                <>India's Largest B2B Marketplace for <span className="text-primary">Wholesale</span> Buying</>
              )}
            </h1>
            <p className="text-lg md:text-xl text-secondary-foreground/80 mb-8">
              {user 
                ? "Ready to source something new for your business today?" 
                : "Connect with verified suppliers, get bulk pricing, and grow your business"
              }
            </p>
            
            {/* Search Bar */}
            <div className="bg-card rounded-lg p-2 shadow-lg max-w-2xl mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchTerm.trim()) navigate(`/products?q=${encodeURIComponent(searchTerm)}`);
                }}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search products, suppliers, or categories..."
                    className="pl-10 h-12 text-foreground border-0 bg-muted/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6">
                  Search
                </Button>
              </form>
            </div>

            {/* Popular searches */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-secondary-foreground/60">Popular:</span>
              {['Banarasi Sarees', 'Silk Fabrics', 'LED Lights', 'Office Furniture'].map(term => (
                <Link 
                  key={term}
                  to={`/products?q=${encodeURIComponent(term)}`}
                  className="px-3 py-1 rounded-full bg-secondary-foreground/10 hover:bg-secondary-foreground/20 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border-b py-6">
        <div className="b2b-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                <span className="text-2xl md:text-3xl font-bold">{isLoading ? '--' : formatNumber(publicStats.products)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Products Listed</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="text-2xl md:text-3xl font-bold">{isLoading ? '--' : formatNumber(publicStats.vendors)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Verified Suppliers</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="text-2xl md:text-3xl font-bold">{isLoading ? '--' : formatNumber(publicStats.buyers)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Buyers Connected</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="text-2xl md:text-3xl font-bold">{isLoading ? '--' : formatNumber(publicStats.rfqs)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">RFQs Fulfilled</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 md:py-16">
        <div className="b2b-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="b2b-section-title">Browse Categories</h2>
            <Link to="/categories" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayCategories.map(category => (
              <CategoryCard key={category.id} category={category} variant="featured" />
            ))}
          </div>
          {displayCategories.length === 0 && !isLoading && (
            <div className="p-10 text-center text-muted-foreground border rounded-xl">
               No categories available. Add some from the admin panel.
            </div>
          )}
        </div>
      </section>

      {/* RFQ Banner */}
      <section className="bg-primary py-10 md:py-14">
        <div className="b2b-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-primary-foreground">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Post your requirement and get quotes from multiple suppliers
              </p>
            </div>
            <Button onClick={() => openConstruction('Request for Quote (RFQ) Board')} size="lg" variant="secondary" className="whitespace-nowrap font-bold uppercase tracking-widest shadow-lg">
                <FileText className="h-5 w-5 mr-2" />
                Post Your Requirement
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 md:py-16">
        <div className="b2b-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="b2b-section-title">Latest Arrivals</h2>
            <Link to="/products" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {latestProducts.slice(0, 8).map(product => {
              const supplier = product.vendor || { companyName: product.supplierName || 'Verified Supplier' };
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  supplier={supplier} 
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Suppliers */}
      <section className="py-10 md:py-16 bg-muted/50">
        <div className="b2b-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="b2b-section-title">Top Suppliers</h2>
            <button onClick={() => openConstruction('Suppliers Directory')} className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayTopSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
          {displayTopSuppliers.length === 0 && !isLoading && (
            <div className="p-10 text-center text-muted-foreground bg-background rounded-xl">
               No featured suppliers yet. Feature them in the Admin Panel Vendor list.
            </div>
          )}
        </div>
      </section>

      {/* Bulk Deals */}
      <section className="py-10 md:py-16">
        <div className="b2b-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="b2b-section-title">Bulk Deals</h2>
            <button onClick={() => openConstruction('Bulk Deals')} className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {latestProducts.slice(0, 8).map(product => {
              // The database product already includes vendor info if available
              const supplier = product.vendor || { companyName: product.supplierName || 'Verified Supplier' };
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  supplier={supplier} 
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-12 md:py-16">
        <div className="b2b-container">
          <div className="grid md:grid-cols-2 gap-6">
            {!user || user.role !== 'buyer' ? (
              <Card className="bg-card shadow-md border-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">Are You a Buyer?</h3>
                  <p className="text-muted-foreground mb-4">
                    Find verified suppliers, compare prices, and get the best deals for your business.
                  </p>
                  <Button asChild>
                    <Link to="/register">
                      Register as Buyer <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">My Buying Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Track your RFQs, manage bulk orders, and message suppliers in one place.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/buyer/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {!user || user.role !== 'vendor' ? (
              <Card className="bg-card shadow-md border-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">Are You a Supplier?</h3>
                  <p className="text-muted-foreground mb-4">
                    Reach millions of buyers, showcase your products, and grow your business.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/vendor/register">
                      Register as Seller <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">Vendor Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage your listings, respond to RFQs, and track your business growth.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/vendor/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
      
      <UnderConstructionModal 
        isOpen={constructionOpen} 
        onClose={() => setConstructionOpen(false)} 
        featureName={featureName} 
      />
    </div>
  );
}
