import { PricingSlab, formatPrice } from '@/data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PricingSlabsTableProps {
  slabs: PricingSlab[];
  unit: string;
  className?: string;
}

export function PricingSlabsTable({ slabs, unit, className }: PricingSlabsTableProps) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Quantity Range</TableHead>
            <TableHead className="font-semibold text-right">Price per {unit}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slabs.map((slab, index) => (
            <TableRow 
              key={index}
              className={cn(
                index === slabs.length - 1 && 'bg-primary/5'
              )}
            >
              <TableCell>
                {slab.minQty} - {slab.maxQty ? slab.maxQty : `${slab.minQty}+`} {unit}
                {index === slabs.length - 1 && (
                  <span className="ml-2 text-xs text-primary font-medium">
                    Best Price
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  'font-semibold',
                  index === slabs.length - 1 ? 'text-primary text-lg' : 'text-foreground'
                )}>
                  {formatPrice(slab.pricePerUnit)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
