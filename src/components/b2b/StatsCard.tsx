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
  const isNumber = typeof value === 'number';

  return (
    <Card className={cn(
      'relative overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group rounded-2xl',
      className
    )}>
      {/* Decorative gradient blur */}
      <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all duration-500 rounded-full" />
      
      <CardContent className="p-4 sm:p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-1">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter"
              >
                {value}
              </motion.p>
            </div>
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
          <div className={cn(
            'p-3 sm:p-4 rounded-2xl transition-all duration-300 group-hover:rotate-6',
            iconClassName || 'bg-primary/10'
          )}>
            <Icon className={cn(
              'h-6 w-6 sm:h-7 sm:w-7',
              iconClassName ? 'text-current' : 'text-primary'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
