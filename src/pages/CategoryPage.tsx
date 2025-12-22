import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  MapPin,
  X
} from 'lucide-react';
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
import { 
  categories, 
  products, 
  getSupplierById, 
  getCategoryById,
  formatPrice
} from '@/data/mockData';

export default function CategoryPage() {
  const { slug } = useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const category = categories.find(c => c.slug === slug);
  const categoryProducts = category 
    ? products.filter(p => p.categoryId === category.id)
    : products;

  const states = ['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Delhi', 'Punjab'];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Subcategories */}
      {category && (
        <div>
          <h3 className="font-semibold mb-3">Subcategories</h3>
          <div className="space-y-2">
            {category.subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/category/${category.slug}/${sub.slug}`}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={50000}
          step={500}
          className="mb-2"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* MOQ Range */}
      <div>
        <h3 className="font-semibold mb-3">Minimum Order Quantity</h3>
        <div className="space-y-2">
          {['1-50', '51-100', '101-500', '500+'].map(range => (
            <div key={range} className="flex items-center gap-2">
              <Checkbox id={`moq-${range}`} />
              <Label htmlFor={`moq-${range}`} className="text-sm font-normal">
                {range} units
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Location */}
      <div>
        <h3 className="font-semibold mb-3">Supplier Location</h3>
        <div className="space-y-2">
          {states.map(state => (
            <div key={state} className="flex items-center gap-2">
              <Checkbox id={`state-${state}`} />
              <Label htmlFor={`state-${state}`} className="text-sm font-normal">
                {state}
              </Label>
            </div>
          ))}
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
          <div className="flex items-center gap-2">
            <Checkbox id="gst" />
            <Label htmlFor="gst" className="text-sm font-normal">
              GST Verified
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="top" />
            <Label htmlFor="top" className="text-sm font-normal">
              Top Suppliers
            </Label>
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="b2b-container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/categories" className="text-muted-foreground hover:text-primary">Categories</Link>
            {category && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{category.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="b2b-container py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border p-4 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Filters</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="bg-card rounded-lg border p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold">
                    {category?.name || 'All Products'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {categoryProducts.length} products found
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile filter */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="moq-low">MOQ: Low to High</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View toggle */}
                  <div className="hidden sm:flex border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active filters */}
              {verifiedOnly && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setVerifiedOnly(false)}
                  >
                    Verified Only
                    <X className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-4'
            }>
              {categoryProducts.map(product => {
                const supplier = getSupplierById(product.supplierId);
                if (!supplier) return null;
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    supplier={supplier}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="secondary" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
