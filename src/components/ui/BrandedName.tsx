import { cn } from '@/lib/utils';

interface BrandedNameProps {
  className?: string;
  showDotCom?: boolean;
}

/**
 * Inline branded name component for use within text.
 * Renders "JummaBaba" with J and B bold, and optional ".com" in orange.
 */
export function BrandedName({ className, showDotCom = true }: BrandedNameProps) {
  return (
    <span className={cn('font-semibold', className)}>
      <span className="text-foreground">
        <span className="font-extrabold">J</span>umma
      </span>
      <span className="text-foreground">
        <span className="font-extrabold">B</span>aba
      </span>
      {showDotCom && <span className="text-b2b-orange">.com</span>}
    </span>
  );
}
