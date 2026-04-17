import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Building, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustBadges } from './TrustBadge';
import { formatPrice, cn } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: any;
  supplier: any;
  className?: string;
}

export function ProductCard({ product, supplier, className }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  if (!product || !supplier) return null;

  // Handle both mock and backend pricing structures
  const pricing = product.pricing_slabs || product.pricingSlabs;
  const lowestPrice = pricing && pricing.length > 0 
    ? pricing[pricing.length - 1].pricePerUnit || pricing[pricing.length - 1].price || pricing[pricing.length - 1].price_per_unit
    : product.min_price || product.minPrice || 0;
  const highestPrice = pricing && pricing.length > 0 
    ? pricing[0].pricePerUnit || pricing[0].price || pricing[0].price_per_unit
    : product.min_price || product.minPrice || 0;
    
  const inWishlist = isInWishlist(product.id);
  const isVerified = product.status === 'approved' || product.is_verified || product.isVerified;

  return (
    <Card className={cn('group overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/50 bg-card', className)}>
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-[4/3] sm:aspect-square overflow-hidden bg-muted">
          <img
            src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600'}
            alt={product.name}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600'; }}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
            loading="lazy"
          />
        </div>
        
        {/* Verification Badge */}
        {isVerified && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-success text-success-foreground border-none shadow-lg px-2 py-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 z-10 bg-background/40 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-background transition-all duration-300 rounded-full",
            inWishlist && "opacity-100 text-destructive hover:text-destructive bg-background/80"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </Button>
      </Link>
      
      <CardContent className="p-3 sm:p-4 flex flex-col h-[60%]">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors mb-1 leading-snug cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2 italic">
          {product.shortDescription || product.short_description || 'Quality wholesale catalog item'}
        </p>

        {/* Price Display: Lowest Price (Tier 4) */}
        <div className="mb-2 flex flex-wrap items-baseline gap-1">
          <span className="text-xl font-extrabold text-foreground">
            {formatPrice(lowestPrice)}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">/ {product.unit || 'Unit'}</span>
        </div>

        {/* MOQ & Fulfillment */}
        <div className="flex items-center justify-between text-[11px] mb-4">
          <div className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
            MOQ: <span className="font-bold text-foreground">{product.moq || 1} {product.unit || 'Unit'}</span>
          </div>
          <div className="flex items-center gap-1 text-success font-semibold uppercase tracking-tighter">
            <Building className="h-3 w-3" />
            Live Stock
          </div>
        </div>

        {/* Supplier Badges */}
        <div className="border-t border-border/50 pt-3 space-y-2 mb-3">
          <TrustBadges
            isTopSupplier={supplier?.isTopSupplier}
            isVerified={isVerified}
          />
        </div>

        {/* CTA */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="w-full relative overflow-hidden group/btn font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white border-primary/20 hover:border-primary transition-all duration-300"
        >
          <span className="flex items-center gap-2 z-10 relative">
            <MessageSquare className="h-3.5 w-3.5" />
            Get Instant Quote
          </span>
          <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
        </Button>
      </CardContent>
    </Card>
  );
}
