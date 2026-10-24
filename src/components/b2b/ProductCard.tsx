import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, Building, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustBadges } from './TrustBadge';
import { formatPrice, cn, PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: any;
  supplier: any;
  className?: string;
}

export function ProductCard({ product, supplier, className }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

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
  const isApproved = product.status === 'approved';
  const isVerified = product.is_verified || product.isVerified;

  const supplierName = supplier?.business_name || supplier?.companyName || supplier?.full_name || 'Verified Supplier';
  const supplierState = supplier?.state || supplier?.location || 'India';

  return (
    <Card className={cn('group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/60 hover:border-primary/50 bg-card flex flex-col', className)}>
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden bg-muted">
        <div className="aspect-[4/3] sm:aspect-square overflow-hidden">
          <img
            src={product.images?.[0] || product.image || PRODUCT_IMAGE_PLACEHOLDER}
            alt={product.name}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER; }}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </div>

        {/* Verification and assurance badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          {isApproved ? (
            <Badge className="bg-[#2563eb] text-white border-none shadow-sm px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-background/90 text-muted-foreground border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              Wholesale
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 z-10 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-background transition-all duration-200 rounded-full h-8 w-8",
            inWishlist && "opacity-100 text-destructive hover:text-destructive bg-background/90"
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

      <CardContent className="p-3.5 sm:p-4 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug cursor-pointer mb-1.5 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Wholesale tiered pricing */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              {formatPrice(lowestPrice)}
            </span>
            {highestPrice > lowestPrice && (
              <span className="text-xs text-muted-foreground font-medium">
                - {formatPrice(highestPrice)}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-semibold">/ {product.unit || 'unit'}</span>
          </div>
          {pricing && pricing.length > 1 && (
            <span className="inline-block text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">
              Volume Slabs
            </span>
          )}
        </div>

        {/* Minimum order quantity */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3 pb-2.5 border-b border-border/50">
          <span className="font-medium">
            Min. order: <strong className="text-foreground">{product.moq || 1} {product.unit || 'units'}</strong>
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            Ready to Ship
          </span>
        </div>

        {/* Supplier details */}
        <div className="mt-auto space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
            <span className="truncate font-medium text-slate-700 flex items-center gap-1">
              <Building className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{supplierName}</span>
            </span>
            <span className="text-[10px] shrink-0 text-slate-500 font-medium">
              {supplierState}
            </span>
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/product/${product.slug}?quote=1`);
            }}
            className="w-full font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white border-primary/25 hover:border-primary transition-colors h-9"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Contact Supplier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
