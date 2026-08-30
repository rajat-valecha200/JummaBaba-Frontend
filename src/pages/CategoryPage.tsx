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
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  // Temp values are the RAW STRING the input is showing, not numbers — during editing (e.g. the
  // user selects-and-deletes the digits to type a fresh value), the field must be able to show
  // genuinely empty for a moment. Coercing that empty string straight to 0 (what this used to do)
  // meant the field re-rendered showing "0" mid-edit, and continued typing appended AFTER that
  // phantom 0 instead of replacing it — typing "100" over a cleared field produced "0100".
  const [tempPriceRange, setTempPriceRange] = useState<string[]>(['0', '1000000']);
  const [absoluteMinMax, setAbsoluteMinMax] = useState<number[]>([0, 1000000]);
  // MOQ range — same Min/Max-input pattern as price, no slider (dragging two handles precisely
  // is exactly what made the price control feel "rigid"; typed numbers avoid that entirely).
  const [moqRange, setMoqRange] = useState<number[]>([0, 1000000]);
  const [tempMoqRange, setTempMoqRange] = useState<string[]>(['0', '1000000']);
  const [absoluteMoqMinMax, setAbsoluteMoqMinMax] = useState<number[]>([0, 1000000]);
  // Location — supplier's state, derived from whatever's actually present in the current product
  // pool (not a hardcoded list) so it never shows a state with zero matching products.
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  // Sync temp price/MOQ when filters are cleared or changed externally (e.g. "Clear All
  // Filters", or category/search changing the absolute bounds) — not on every keystroke, since
  // typing only ever changes tempPriceRange/tempMoqRange themselves, never priceRange/moqRange
  // directly.
  useEffect(() => {
    setTempPriceRange(priceRange.map(String));
  }, [priceRange]);
  useEffect(() => {
    setTempMoqRange(moqRange.map(String));
  }, [moqRange]);

  // Parses the two raw strings the Min/Max inputs are currently showing into a committed
  // number[] — a blank field (user cleared it and hasn't typed a replacement yet) commits as 0,
  // same as before, just no longer fighting with the field while they're still mid-edit. If Min
  // ends up greater than Max (typed backwards, or Min raised past the current Max), swap them
  // rather than silently applying a range that can never match anything — the fields themselves
  // will visibly swap too, via the sync effect above, so it's not a hidden correction.
  const parseRange = (temp: string[]): number[] => {
    const [a, b] = temp.map(v => parseInt(v, 10) || 0);
    return a <= b ? [a, b] : [b, a];
  };

  // Auto-apply ~500ms after the user stops typing — no click-away/Enter required to see results
  // update. (Enter/blur below still commit immediately, for anyone who does do that.) This only
  // became viable once typing itself stopped re-rendering the whole filter panel per keystroke
  // (see the filterContent/remount fix) — debouncing a laggy input would have just made the lag
  // less visible instead of fixing the actual UX gap.
  useEffect(() => {
    const handle = setTimeout(() => setPriceRange(parseRange(tempPriceRange)), 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempPriceRange]);
  useEffect(() => {
    const handle = setTimeout(() => setMoqRange(parseRange(tempMoqRange)), 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempMoqRange]);

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

      // Initial set or reset when category changes — tempPriceRange follows automatically via
      // the sync effect above once priceRange itself changes, no need to set it here too.
      setPriceRange([min, max]);

      const moqs = prePriceFilteredProducts.map((p: any) => p.moq || 0);
      const moqMin = Math.floor(Math.min(...moqs));
      const moqMax = Math.ceil(Math.max(...moqs));
      setAbsoluteMoqMinMax([moqMin, moqMax]);
      setMoqRange([moqMin, moqMax]);
    } else {
      setAbsoluteMinMax([0, 100000]);
      setPriceRange([0, 100000]);
      setAbsoluteMoqMinMax([0, 10000]);
      setMoqRange([0, 10000]);
    }
  }, [prePriceFilteredProducts.length > 0, category?.id, searchQuery]);

  // Distinct supplier states actually present in this pool — never a stale hardcoded list.
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    prePriceFilteredProducts.forEach((p: any) => {
      const state = p.supplier_state;
      if (state) set.add(state);
    });
    return Array.from(set).sort();
  }, [prePriceFilteredProducts]);

  // 3. Apply Price, MOQ & Location filters, then sort — memoized so typing in the Min/Max
  // inputs (which only updates the LOCAL tempPriceRange/tempMoqRange, not these committed
  // values) doesn't re-run this filter+sort on every keystroke. Before this was memoized, EVERY
  // render — including the one from each character typed — recomputed the full filter/sort over
  // the whole product list, which is exactly what made typing feel laggy.
  const filteredProducts = useMemo(() => {
    const filtered = prePriceFilteredProducts.filter(p => {
      const price = p.min_price || p.minPrice || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const moq = p.moq || 0;
      const matchesMoq = moq >= moqRange[0] && moq <= moqRange[1];
      const matchesLocation = selectedStates.length === 0 || selectedStates.includes(p.supplier_state);
      return matchesPrice && matchesMoq && matchesLocation;
    });

    const getPrice = (p: any) => p.min_price || p.minPrice || 0;
    return [...filtered].sort((a, b) => {
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
  }, [prePriceFilteredProducts, priceRange, moqRange, selectedStates, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }



  // Plain JSX variable, NOT a component defined-and-called as `<FilterContent />` — that pattern
  // (a function component declared inside another component's body) makes React treat it as a
  // brand-new component TYPE on every parent re-render (a fresh function reference each time),
  // which forces a full unmount+remount of this entire subtree on every keystroke. That's what
  // was actually causing the laggy typing AND the "only the first character sticks" bug — the
  // <input> DOM node (and its focus/cursor position) was being destroyed and recreated after
  // every single character, since typing here itself triggers the parent CategoryPage re-render.
  // A plain JSX expression, spliced in directly via {filterContent} below, doesn't have that
  // problem — React diffs it by tree position/element type, not by component-type identity.
  const filterContent = (
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

      {/* Price Range — typed Min/Max, no drag slider. Dragging two handles precisely is exactly
          what made this feel "rigid"; typed numbers are faster and more precise, especially on
          mobile. Auto-applies ~500ms after typing stops (or immediately on Enter/tapping away)
          — not something a real user should have to know to do on purpose. */}
      <div className="bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Price Range</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold">
            {filteredProducts.length} Results
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Results update automatically as you type</p>
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 shadow-sm">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Min (₹)</span>
            <Input
              type="number"
              value={tempPriceRange[0]}
              onChange={(e) => setTempPriceRange([e.target.value, tempPriceRange[1]])}
              // Always commit the FULL current tempPriceRange, not [thisField, priceRange[other]]
              // — that older version paired the field just edited with the OLD committed value
              // for the OTHER field instead of whatever was currently typed there, so editing
              // both Min and Max before tapping away silently dropped one of the two edits
              // (which one, dependent on typing order/timing — "filters after 2-3 attempts,
              // then stops" was this race, not a one-off glitch).
              onKeyDown={(e) => { if (e.key === 'Enter') setPriceRange(parseRange(tempPriceRange)); }}
              onBlur={() => setPriceRange(parseRange(tempPriceRange))}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="text-muted-foreground self-end pb-2 font-light">─</div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Max (₹)</span>
            <Input
              type="number"
              value={tempPriceRange[1]}
              onChange={(e) => setTempPriceRange([tempPriceRange[0], e.target.value])}
              onKeyDown={(e) => { if (e.key === 'Enter') setPriceRange(parseRange(tempPriceRange)); }}
              onBlur={() => setPriceRange(parseRange(tempPriceRange))}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* MOQ Range — same typed Min/Max pattern, on the product's own MOQ column (already
          available on every product, just never had a filter UI). */}
      <div className="bg-card">
        <h3 className="font-semibold mb-4">MOQ Range</h3>
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 shadow-sm">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Min</span>
            <Input
              type="number"
              value={tempMoqRange[0]}
              onChange={(e) => setTempMoqRange([e.target.value, tempMoqRange[1]])}
              onKeyDown={(e) => { if (e.key === 'Enter') setMoqRange(parseRange(tempMoqRange)); }}
              onBlur={() => setMoqRange(parseRange(tempMoqRange))}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="text-muted-foreground self-end pb-2 font-light">─</div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-primary/70 uppercase mb-1 block">Max</span>
            <Input
              type="number"
              value={tempMoqRange[1]}
              onChange={(e) => setTempMoqRange([tempMoqRange[0], e.target.value])}
              onKeyDown={(e) => { if (e.key === 'Enter') setMoqRange(parseRange(tempMoqRange)); }}
              onBlur={() => setMoqRange(parseRange(tempMoqRange))}
              className="h-9 text-sm font-bold bg-background border-border/50 focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Location — supplier's state, list built from whatever's actually present above (never
          a hardcoded/stale list of states with zero matching products). */}
      {availableStates.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Supplier Location</h3>
          <div className="space-y-2">
            {availableStates.map((state) => (
              <div key={state} className="flex items-center gap-2">
                <Checkbox
                  id={`state-${state}`}
                  checked={selectedStates.includes(state)}
                  onCheckedChange={(checked) => {
                    setSelectedStates(prev =>
                      checked ? [...prev, state] : prev.filter(s => s !== state)
                    );
                  }}
                />
                <Label htmlFor={`state-${state}`} className="text-sm font-normal">
                  {state}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" className="w-full text-xs uppercase font-bold tracking-widest" onClick={() => {
        setPriceRange(absoluteMinMax);
        setTempPriceRange(absoluteMinMax.map(String));
        setMoqRange(absoluteMoqMinMax);
        setTempMoqRange(absoluteMoqMinMax.map(String));
        setSelectedStates([]);
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
              {filterContent}
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
                    Showing <span className="text-primary font-bold">{filteredProducts.length}</span> results
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
                        {filterContent}
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
              {(priceRange[0] > absoluteMinMax[0] || priceRange[1] < absoluteMinMax[1] ||
                moqRange[0] > absoluteMoqMinMax[0] || moqRange[1] < absoluteMoqMinMax[1] ||
                selectedStates.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Applied:</span>

                  {(priceRange[0] > absoluteMinMax[0] || priceRange[1] < absoluteMinMax[1]) && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setPriceRange(absoluteMinMax);
                        setTempPriceRange(absoluteMinMax.map(String));
                      }}
                    >
                      Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                      <X className="h-3 w-3" />
                    </Badge>
                  )}

                  {(moqRange[0] > absoluteMoqMinMax[0] || moqRange[1] < absoluteMoqMinMax[1]) && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setMoqRange(absoluteMoqMinMax);
                        setTempMoqRange(absoluteMoqMinMax.map(String));
                      }}
                    >
                      MOQ: {moqRange[0]} - {moqRange[1]}
                      <X className="h-3 w-3" />
                    </Badge>
                  )}

                  {selectedStates.map((state) => (
                    <Badge
                      key={state}
                      variant="secondary"
                      className="px-3 py-1 text-[10px] font-bold uppercase transition-all hover:bg-destructive hover:text-destructive-foreground cursor-pointer flex items-center gap-1"
                      onClick={() => setSelectedStates(prev => prev.filter(s => s !== state))}
                    >
                      {state}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
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
                    setPriceRange(absoluteMinMax);
                    setTempPriceRange(absoluteMinMax.map(String));
                    setMoqRange(absoluteMoqMinMax);
                    setTempMoqRange(absoluteMoqMinMax.map(String));
                    setSelectedStates([]);
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
