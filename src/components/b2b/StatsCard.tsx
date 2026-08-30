import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName
}: StatsCardProps) {
  // Only the text-color half of iconClassName (e.g. "bg-blue-500/10 text-blue-500") is used for
  // the background watermark below — its bg-*/10 half is reused as-is for the small title chip.
  const iconColorClass = iconClassName?.split(' ').find((c) => c.startsWith('text-')) || 'text-primary';

  return (
    <Card className={cn(
      'relative overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group rounded-2xl',
      className
    )}>
      {/* Large, faint background watermark for depth — kept deliberately out of the value's way
          (no dedicated icon box competing for width) so the value never has to truncate, however
          long it gets (e.g. a currency total past a few lakh, or a narrow 5-column dashboard row). */}
      <Icon className={cn(
        'pointer-events-none absolute -right-3 -bottom-3 h-20 w-20 sm:h-24 sm:w-24 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300',
        iconColorClass
      )} />

      <CardContent className="p-4 sm:p-6 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg shrink-0', iconClassName || 'bg-primary/10')}>
              <Icon className={cn('h-3.5 w-3.5', iconClassName ? 'text-current' : 'text-primary')} />
            </div>
            {/* Wrapping a short label like "Pending Moderation" onto two lines reads fine —
                unlike break-words on the value below, which was splitting a currency figure
                mid-digit-group (e.g. "₹2,27,4" / "57"), worse than not wrapping at all. */}
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter whitespace-nowrap"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs font-medium text-muted-foreground/80">{subtitle}</p>
          )}
          {trend && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'text-xs font-bold flex items-center gap-1 mt-1',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              <span className="px-1.5 py-0.5 rounded-full bg-current/10">
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-muted-foreground/60 font-medium">vs last month</span>
            </motion.p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
