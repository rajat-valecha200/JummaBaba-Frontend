import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  X,
  Loader2,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProductCard } from '@/components/b2b/ProductCard';
import { api } from '@/lib/api';
import {
  categories,
  products as mockProducts,
  suppliers as mockSuppliers,
  getSupplierById,
  formatPrice
} from '@/data/mockData';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [tempPriceRange, setTempPriceRange] = useState<number[]>([0, 100000]);

  // Sync temp price when filters are cleared or changed externally
  useEffect(() => {
    setTempPriceRange(priceRange);
  }, [priceRange]);

  const category = categories.find(c => c.slug === slug);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list('approved');

      // Transform backend products to match frontend expectations
      const transformed = data.map((p: any) => ({
        ...p,
        shortDescription: p.short_description,
        supplierId: p.supplier_id,
        category: p.category_id || p.category,
        image: p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        isVerified: p.status === 'approved' || p.is_verified
      }));
      setDbProducts(transformed);
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [slug]);

  // Combine DB and Mock products for the demonstration
  const allProducts = [...dbProducts, ...mockProducts.filter(mp => !dbProducts.find(dp => dp.id === mp.id))];

  // Apply Client-side Filtering
  const filteredProducts = allProducts.filter(p => {
    const pCategoryId = p.category_id || p.categoryId || p.category;
    const matchesCategory = !category || pCategoryId === category.id;

    const pricing = p.pricing_slabs || p.pricingSlabs;
    const price = pricing?.[0]?.pricePerUnit || pricing?.[0]?.price || p.price || p.min_price || p.minPrice || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesVerified = !verifiedOnly || p.isVerified;
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());

    return (!slug || matchesCategory) && matchesPrice && matchesVerified && matchesSearch;
  });

  const states = ['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Delhi', 'Punjab'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }



  const FilterContent = () => (
    <div className="space-y-6">
      {/* Subcategories */}
      {category && (
        <div className="bg-card">
          <h3 className="font-semibold mb-3 flex items-center justify-between">
            <span>Subcategories</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </h3>
          <div className="space-y-1">
            {category.subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/category/${category.slug}/${sub.slug}`}
                className="block text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 px-2 py-1.5 rounded-md transition-all"
                onClick={() => setLoading(true)}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="bg-card">
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="px-4"> {/* High-margin container for corner-to-corner access */}
          <Slider
            value={[
              (tempPriceRange[0] / 100000) * 1000,
              (tempPriceRange[1] / 100000) * 1000
            ]}
            onValueChange={(vals) => {
              setTempPriceRange([
                Math.round((vals[0] / 1000) * 100000),
                Math.round((vals[1] / 1000) * 100000)
              ]);
            }}
            onValueCommit={(vals) => {
              // Only trigger heavy product filtering when user lets go
              setPriceRange([
                Math.round((vals[0] / 1000) * 100000),
                Math.round((vals[1] / 1000) * 100000)
              ]);
            }}
            min={0}
            max={1000}
            step={1}
            className="mb-8"
          />
        </div>
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 shadow-sm mt-4">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Min (₹)</span>
            <Input
              type="number"
              value={tempPriceRange[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempPriceRange([val, tempPriceRange[1]]);
              }}
              onBlur={() => setPriceRange([tempPriceRange[0], priceRange[1]])}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="text-muted-foreground self-end pb-2 font-light">─</div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Max (₹)</span>
            <Input
              type="number"
              value={tempPriceRange[1]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempPriceRange([tempPriceRange[0], val]);
              }}
              onBlur={() => setPriceRange([priceRange[0], tempPriceRange[1]])}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Verified Supplier */}
      <div>
        <h3 className="font-semibold mb-3">Supplier Type</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified"
              checked={verifiedOnly}
              onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
            />
            <Label htmlFor="verified" className="text-sm font-normal">
              Verified Suppliers Only
            </Label>
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full text-xs uppercase font-bold tracking-widest" onClick={() => {
        setPriceRange([0, 100000]);
        setTempPriceRange([0, 100000]);
        setVerifiedOnly(false);
      }}>
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b py-4">
        <div className="b2b-container">
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
            {category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary font-bold">{category.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="b2b-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-card rounded-xl border p-6 sticky top-24 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Smart Filters</h2>
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="bg-card rounded-xl border p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-b2b-black mb-1">
                    {category?.name || 'Wholesale Marketplace'}
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Showing <span className="text-primary font-bold">{filteredProducts.length}</span> verified results
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Mobile filter */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden font-bold">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="font-bold">Marketplace Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-8">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-xs font-bold text-muted-foreground uppercase">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-44 font-medium">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Highly Relevant</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Fresh Collections</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active filters */}
              {(verifiedOnly || priceRange[0] > 0 || priceRange[1] < 100000) && (
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Applied:</span>
                  
                  {verifiedOnly && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => setVerifiedOnly(false)}
                    >
                      Verified Only
                      <X className="h-3 w-3" />
                    </Badge>
                  )}

                  {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setPriceRange([0, 100000]);
                        setTempPriceRange([0, 100000]);
                      }}
                    >
                      Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const supplier = getSupplierById(product.supplier_id || product.supplierId) || mockSuppliers[0];
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    supplier={supplier}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  />
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-card rounded-xl border p-12 text-center shadow-sm">
                <div className="max-w-md mx-auto">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Matching Products</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any products matching your specific filters. Try broadening your criteria.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setPriceRange([0, 100000]);
                    setVerifiedOnly(false);
                  }}>
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
