import { Link } from 'react-router-dom';
import { MapPin, Star, Package, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustBadges } from './TrustBadge';
import { formatNumber, cn } from '@/lib/utils';

interface SupplierCardProps {
  supplier: any;
  className?: string;
}

export function SupplierCard({ supplier, className }: SupplierCardProps) {
  const yearsInBusiness = new Date().getFullYear() - (supplier.yearEstablished || 2015);

  return (
    <Link to={`/supplier/${supplier.id}`} className="block h-full">
      <Card className={cn('group h-full overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 relative bg-white border-border/60', className)}>
        {/* View Hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 px-2 py-0.5 rounded text-[8px] font-black text-primary uppercase tracking-widest border border-primary/20 z-20">
          View Profile
        </div>

        <CardContent className="p-5">
          <div className="flex gap-4 mb-4">
            {/* Logo */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0 p-2 group-hover:border-primary/20 transition-colors">
              <img
                src={supplier.logo}
                alt={supplier.companyName}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-black group-hover:text-primary transition-colors block truncate tracking-tight">
                {supplier.companyName}
              </h3>

              <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1 font-medium">
                <MapPin className="h-3 w-3" />
                <span>{supplier.location}, {supplier.state || 'India'}</span>
              </div>

              <TrustBadges
                gstVerified={supplier.gstVerified}
                isTopSupplier={supplier.isTopSupplier}
                className="mt-2.5"
              />
            </div>
          </div>

          {/* Stats Grid - CLEANER */}
          <div className="grid grid-cols-3 gap-2 py-4 border-t border-zinc-100 bg-zinc-50/50 -mx-5 px-5">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-black text-xs text-black">{supplier.rating || '4.8'}</span>
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">Rating</p>
            </div>
            
            <div className="text-center border-x border-zinc-100">
              <div className="flex items-center justify-center gap-1">
                <Package className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-black text-xs text-black">{formatNumber(supplier.totalProducts || 0)}</span>
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">Products</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-black text-xs text-black">{yearsInBusiness}+</span>
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">Years</p>
            </div>
          </div>

          {/* Business Meta */}
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="outline" className="bg-white border-zinc-200 text-[10px] font-black text-zinc-600 uppercase tracking-widest rounded-md px-2 py-0">
              {supplier.businessType || 'Manufacturer'}
            </Badge>
            <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest">
              Explore Store <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
