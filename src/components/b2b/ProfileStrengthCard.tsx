import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ProfileStrengthItem {
  label: string;
  done: boolean;
}

// Shared "Profile Strength" widget — same design used on the Buyer Profile page and, when the
// profile is incomplete, surfaced again on the Buyer Dashboard as a nudge (e.g. no phone number
// on file yet, which we otherwise only ask for deep inside an RFQ/checkout form).
export function ProfileStrengthCard({ items, className }: { items: ProfileStrengthItem[]; className?: string }) {
  const percent = items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0;
  return (
    <Card className={cn('border-none shadow-lg overflow-hidden', className)}>
      <CardHeader className="bg-success/5 border-b border-success/10 pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          Profile Strength
          <Badge variant="outline" className="bg-white/50">{percent}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border">
            <div
              className="h-full bg-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-1000 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="grid gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                <span className={cn(item.done ? 'text-foreground font-medium' : 'text-muted-foreground')}>{item.label}</span>
                {item.done ? <CheckCircle className="h-4 w-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2 border-muted" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
