import { useState, useEffect, useMemo } from 'react';
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
import { formatPrice, cn } from '@/lib/utils';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [tempPriceRange, setTempPriceRange] = useState<number[]>([0, 1000000]);
  const [absoluteMinMax, setAbsoluteMinMax] = useState<number[]>([0, 1000000]);

  // Sync temp price when filters are cleared or changed externally
  useEffect(() => {
    setTempPriceRange(priceRange);
  }, [priceRange]);

  const category = dbCategories.find(c => c.slug === slug || c.id === slug);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Categories
      const catRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setDbCategories(catData);
      }

      // 2. Fetch Products
      const data = await api.products.list('approved');
      setDbProducts(data);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [slug]);

  // 1. Get products matching Category & Search (Pre-Price Filter)
  const prePriceFilteredProducts = useMemo(() => {
    return dbProducts.filter(p => {
      const pCategoryId = p.category_id || p.categoryId;
      const matchesCategory = !category || String(pCategoryId) === String(category.id);
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return (!slug || matchesCategory) && matchesSearch;
    });
  }, [dbProducts, category, searchQuery, slug]);

  // 2. Dynamically calculate absolute range from pre-filtered pool
  useEffect(() => {
    if (prePriceFilteredProducts.length > 0) {
      const prices = prePriceFilteredProducts.map((p: any) => p.min_price || p.minPrice || 0);
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      
      // Update absolute bounds
      setAbsoluteMinMax([min, max]);
      
      // Initial set or reset when category changes
      setPriceRange([min, max]);
      setTempPriceRange([min, max]);
    } else {
      setAbsoluteMinMax([0, 100000]);
      setPriceRange([0, 100000]);
      setTempPriceRange([0, 100000]);
    }
  }, [prePriceFilteredProducts.length > 0, category?.id, searchQuery]);

  // 3. Apply Price & Verified Filters
  let filteredProducts = prePriceFilteredProducts.filter(p => {
    const price = p.min_price || p.minPrice || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesVerified = !verifiedOnly || p.isVerified;
    return matchesPrice && matchesVerified;
  });

  // Apply Sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    const getPrice = (p: any) => p.min_price || p.minPrice || 0;

    switch (sortBy) {
      case 'price-low':
        return getPrice(a) - getPrice(b);
      case 'price-high':
        return getPrice(b) - getPrice(a);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
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
            {category.subcategories?.map((sub: any) => (
              <Link
                key={sub.id}
                to={`/category/${category.slug}/${sub.slug}`}
                className="block text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 px-2 py-1.5 rounded-md transition-all"
                onClick={() => setLoading(true)}
              >
                {sub.name}
              </Link>
            ))}
            {(!category.subcategories || category.subcategories.length === 0) && (
              <p className="text-xs text-muted-foreground px-2">No subcategories</p>
            )}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Price Range</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold">
            {filteredProducts.length} Results
          </span>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: 'Budget', max: 500 },
            { label: 'Value', max: 2000 },
            { label: 'Premium', min: 5000 },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                const min = chip.min || absoluteMinMax[0];
                const max = chip.max || absoluteMinMax[1];
                setPriceRange([min, max]);
                setTempPriceRange([min, max]);
              }}
              className="text-[10px] font-bold px-3 py-1 rounded-full border border-border/60 hover:border-primary hover:text-primary transition-all bg-background"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="px-2">
          <Slider
            value={tempPriceRange}
            onValueChange={setTempPriceRange}
            onValueCommit={setPriceRange}
            min={absoluteMinMax[0]}
            max={absoluteMinMax[1]}
            step={Math.max(1, Math.floor((absoluteMinMax[1] - absoluteMinMax[0]) / 100))}
            className="mb-6"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPriceRange([tempPriceRange[0], priceRange[1]]);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPriceRange([priceRange[0], tempPriceRange[1]]);
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
        setPriceRange(absoluteMinMax);
        setTempPriceRange(absoluteMinMax);
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
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-bold">{category?.name || 'All Products'}</span>
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
              {(verifiedOnly || priceRange[0] > absoluteMinMax[0] || priceRange[1] < absoluteMinMax[1]) && (
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
                  
                  {(priceRange[0] > absoluteMinMax[0] || priceRange[1] < absoluteMinMax[1]) && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setPriceRange(absoluteMinMax);
                        setTempPriceRange(absoluteMinMax);
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
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  supplier={p.vendor}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                />
              ))}
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
