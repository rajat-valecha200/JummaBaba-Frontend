import { CheckCircle2, AlertTriangle, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditEntry } from '@/lib/auditTrail';

const TONE_STYLES: Record<AuditEntry['tone'], { dot: string; icon: typeof Circle }> = {
  success: { dot: 'border-emerald-500 bg-emerald-500 text-white', icon: CheckCircle2 },
  warning: { dot: 'border-amber-500 bg-amber-500 text-white', icon: AlertTriangle },
  danger: { dot: 'border-rose-500 bg-rose-500 text-white', icon: XCircle },
  neutral: { dot: 'border-slate-300 bg-white text-slate-400', icon: Circle },
};

export function RfqAuditTrail({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-6 text-center">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-5 ml-2 border-l-2 border-border/60 pl-6 py-2">
      {entries.map((entry) => {
        const style = TONE_STYLES[entry.tone];
        const Icon = style.icon;
        return (
          <div key={entry.id} className="relative">
            <div className={cn(
              "absolute -left-[33px] w-4 h-4 rounded-full border-2 flex items-center justify-center",
              style.dot
            )}>
              <Icon className="h-2.5 w-2.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-foreground">{entry.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
