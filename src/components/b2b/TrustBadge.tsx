import { CheckCircle, Shield, Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  type: 'verified' | 'gst' | 'top-supplier' | 'trusted';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig = {
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    className: 'bg-success/10 text-success border-success/20',
  },
  gst: {
    icon: Shield,
    label: 'GST Verified',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  'top-supplier': {
    icon: Award,
    label: 'Top Supplier',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  trusted: {
    icon: Star,
    label: 'Trusted',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-1 text-xs gap-1',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    badge: 'px-2.5 py-1.5 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
};

export function TrustBadge({ type, size = 'md', showLabel = true, className }: TrustBadgeProps) {
  const config = badgeConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.className,
        sizeStyles.badge,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface TrustBadgesProps {
  gstVerified?: boolean;
  isTopSupplier?: boolean;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrustBadges({ 
  gstVerified, 
  isTopSupplier, 
  isVerified, 
  size = 'sm',
  className 
}: TrustBadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {isTopSupplier && <TrustBadge type="top-supplier" size={size} />}
      {gstVerified && <TrustBadge type="gst" size={size} />}
      {isVerified && <TrustBadge type="verified" size={size} />}
    </div>
  );
}
