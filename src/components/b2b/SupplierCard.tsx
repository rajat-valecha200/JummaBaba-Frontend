import { Link } from 'react-router-dom';
import { MapPin, Star, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrustBadges } from './TrustBadge';
import { Supplier, formatNumber } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface SupplierCardProps {
  supplier: Supplier;
  className?: string;
}

export function SupplierCard({ supplier, className }: SupplierCardProps) {
  const yearsInBusiness = new Date().getFullYear() - supplier.yearEstablished;

  return (
    <Card className={cn('group overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={supplier.logo}
              alt={supplier.companyName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link 
              to={`/supplier/${supplier.id}`}
              className="font-semibold text-base sm:text-lg hover:text-primary transition-colors block truncate"
            >
              {supplier.companyName}
            </Link>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{supplier.location}, {supplier.state}</span>
            </div>

            <TrustBadges
              gstVerified={supplier.gstVerified}
              isTopSupplier={supplier.isTopSupplier}
              className="mt-2"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-semibold">{supplier.rating}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{formatNumber(supplier.totalProducts)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Products</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{yearsInBusiness}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Years</p>
          </div>
        </div>

        {/* Business Type */}
        <p className="text-sm text-muted-foreground mt-3">
          <span className="font-medium text-foreground">{supplier.businessType}</span>
          <span className="mx-2">•</span>
          <span>{supplier.annualTurnover}</span>
        </p>

        {/* CTA */}
        <div className="flex gap-2 mt-4">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/supplier/${supplier.id}`}>
              View Profile
            </Link>
          </Button>
          <Button className="flex-1">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
