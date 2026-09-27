import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProfileStrengthItem } from './ProfileStrengthCard';

// Compact, full-width nudge — same amber-banner language used elsewhere in the app (e.g. the
// employee "complete your profile" banner) — instead of the tall checklist card, which looked
// like a stray, half-empty box sitting alone at the top of the dashboard. The full checklist still
// lives on the Buyer Profile page, where it has a natural sidebar spot next to other cards.
export function ProfileStrengthBanner({ items, to, className }: { items: ProfileStrengthItem[]; to: string; className?: string }) {
  const missing = items.filter((i) => !i.done);
  if (missing.length === 0) return null;
  const percent = Math.round(((items.length - missing.length) / items.length) * 100);

  return (
    <div className={cn('rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4', className)}>
      <div className="h-9 w-9 shrink-0 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
        <ShieldCheck className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm">Complete your profile</p>
          <span className="text-xs font-bold text-amber-700">{percent}%</span>
        </div>
        <div className="h-1.5 bg-white rounded-full overflow-hidden max-w-[220px] border border-amber-500/20">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">Still missing: {missing.map((m) => m.label).join(', ')}</p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800">
        <Link to={to}>Complete profile<ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
      </Button>
    </div>
  );
}
