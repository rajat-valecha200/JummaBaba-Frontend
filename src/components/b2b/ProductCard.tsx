import { Link } from 'react-router-dom';
import { MapPin, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrustBadges } from './TrustBadge';
import { Product, Supplier, formatPrice } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  supplier: Supplier;
  className?: string;
}

export function ProductCard({ product, supplier, className }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const lowestPrice = product.pricingSlabs[product.pricingSlabs.length - 1].pricePerUnit;
  const highestPrice = product.pricingSlabs[0].pricePerUnit;
  const inWishlist = isInWishlist(product.id);

  return (
    <Card className={cn('group overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
      <Link to={`/product/${product.slug}`} className="relative block">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background",
            inWishlist && "text-destructive hover:text-destructive"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
        >
          <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
        </Button>
      </Link>
      
      <CardContent className="p-3 sm:p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {product.shortDescription}
        </p>

        {/* Price Range */}
        <div className="mb-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(lowestPrice)}
          </span>
          {lowestPrice !== highestPrice && (
            <span className="text-sm text-muted-foreground">
              {' - '}{formatPrice(highestPrice)}
            </span>
          )}
          <span className="text-xs text-muted-foreground"> / {product.unit}</span>
        </div>

        {/* MOQ */}
        <p className="text-xs text-muted-foreground mb-3">
          MOQ: <span className="font-medium text-foreground">{product.moq} {product.unit}</span>
        </p>

        {/* Supplier Info */}
        <div className="border-t pt-3 space-y-2">
          <Link 
            to={`/supplier/${supplier.id}`}
            className="text-sm font-medium hover:text-primary transition-colors block"
          >
            {supplier.companyName}
          </Link>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{supplier.location}, {supplier.state}</span>
          </div>

          <TrustBadges
            gstVerified={supplier.gstVerified}
            isTopSupplier={supplier.isTopSupplier}
            isVerified={product.isVerified}
          />
        </div>

        {/* CTA */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Supplier
        </Button>
      </CardContent>
    </Card>
  );
}
