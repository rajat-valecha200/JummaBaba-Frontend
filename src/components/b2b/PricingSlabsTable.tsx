import { formatPrice } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PricingSlab {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
}

interface PricingSlabsTableProps {
  slabs: PricingSlab[];
  unit: string;
  className?: string;
}

export function PricingSlabsTable({ slabs, unit, className }: PricingSlabsTableProps) {
  if (!slabs || slabs.length === 0) return null;

  const basePrice = slabs[0]?.pricePerUnit || 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tiered pricing slab cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {slabs.map((slab, index) => {
          const isBest = index === slabs.length - 1 && slabs.length > 1;
          const discountPct = basePrice > slab.pricePerUnit && basePrice > 0
            ? Math.round(((basePrice - slab.pricePerUnit) / basePrice) * 100)
            : 0;

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-xl border text-center transition-all bg-card',
                isBest ? 'border-primary/40 bg-primary/[0.03] shadow-sm' : 'border-border/60 hover:border-border'
              )}
            >
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
                {slab.minQty}{slab.maxQty ? ` - ${slab.maxQty}` : '+'} {unit}
              </div>
              <div className="text-base sm:text-lg font-bold text-foreground mt-1">
                {formatPrice(slab.pricePerUnit)}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                per {unit}
              </div>
              {discountPct > 0 && (
                <div className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Save {discountPct}%
                </div>
              )}
              {isBest && discountPct === 0 && (
                <div className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary">
                  Bulk Tier
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CompactPricingProps {
  slabs: PricingSlab[];
  unit: string;
  className?: string;
}

export function CompactPricing({ slabs, unit, className }: CompactPricingProps) {
  const lowestPrice = slabs[slabs.length - 1].pricePerUnit;
  const highestPrice = slabs[0].pricePerUnit;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-primary">
          {formatPrice(lowestPrice)}
        </span>
        {lowestPrice !== highestPrice && (
          <>
            <span className="text-muted-foreground">-</span>
            <span className="text-lg font-semibold text-muted-foreground">
              {formatPrice(highestPrice)}
            </span>
          </>
        )}
        <span className="text-sm text-muted-foreground">/ {unit}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {slabs.length} pricing slabs available
      </p>
    </div>
  );
}
