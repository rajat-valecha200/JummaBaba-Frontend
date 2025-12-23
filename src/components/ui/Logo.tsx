import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <span className={cn('font-bold tracking-tight', sizeClasses[size], className)}>
      <span className="text-foreground">
        <span className="font-extrabold">J</span>umma
      </span>
      <span className="text-foreground">
        <span className="font-extrabold">B</span>aba
      </span>
      <span className="text-b2b-orange">.com</span>
    </span>
  );
}
