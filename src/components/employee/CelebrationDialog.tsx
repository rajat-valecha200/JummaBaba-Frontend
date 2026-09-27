import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';

// The "great news" popup: whenever points have been RELEASED since the employee last looked,
// list them once (e.g. a referred seller just got approved: +10 points), then mark them seen.
export function CelebrationDialog() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.employees.celebrations().then((rows) => {
      if (Array.isArray(rows) && rows.length > 0) { setItems(rows); setOpen(true); }
    }).catch(() => { /* purely a nicety — never block the portal */ });
  }, []);

  const close = () => {
    setOpen(false);
    api.employees.celebrationsSeen().catch(() => {});
  };
  const total = items.reduce((s, i) => s + i.points, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
            <PartyPopper className="h-7 w-7 text-orange-500" />
          </div>
          <DialogTitle className="text-center text-xl">Great news! +{total} points</DialogTitle>
          <DialogDescription className="text-center">These points are now available.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
              <span>{i.referred_name ? `${i.referred_name} — ` : ''}{i.task_label}{i.event_type === 'custom' && i.description ? ` · ${i.description}` : ''}</span>
              <b className="text-emerald-600 shrink-0">+{i.points}</b>
            </li>
          ))}
        </ul>
        <DialogFooter><Button className="w-full" onClick={close}>Awesome</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
