import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// The three admin actions on an employee's points, shared by the Employees list and the employee's own page.

type Done = () => void | Promise<void>;

// Records a payment made outside the app. `target` = an employee row that carries wallet fields.
export function PayDialog({ target, onClose, onDone }: { target: any; onClose: () => void; onDone: Done }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ reference: '', note: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setForm({ reference: '', note: '' }); }, [target?.id]);
  const confirm = async () => {
    setBusy(true);
    try {
      await api.employees.adminPay(target.id, form);
      toast({ title: 'Payment recorded' });
      onClose();
      await onDone();
    } catch (err: any) {
      toast({ title: 'Could not record payment', description: err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark paid — {target?.full_name}</DialogTitle>
          <DialogDescription>Pay the employee outside the app first, then record it here.</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p><b>{target.available_points}</b> released points → <b className="text-lg">{formatPrice(target.available_amount)}</b></p>
              <p className="text-xs text-muted-foreground">
                {(target.breakdown || []).map((b: any) => (b.month ? `${b.month}: ${b.points} pts @ ₹${b.rate}` : `${b.points} pts @ ₹${b.rate}`)).join(' · ')}
              </p>
              <p className="text-xs text-muted-foreground">After this their released points restart from zero. {target.blocked_points} blocked points are not affected.</p>
            </div>
            <div className="space-y-1.5"><Label>Payment reference (UTR / transaction id) *</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Note</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="optional" /></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.reference.trim() || busy} onClick={confirm}>Confirm payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Zeroes the available points without paying; reversible through Void.
export function ResetDialog({ target, onClose, onDone }: { target: any; onClose: () => void; onDone: Done }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setReason(''); }, [target?.id]);
  const confirm = async () => {
    setBusy(true);
    try {
      await api.employees.adminResetPoints(target.id, reason);
      toast({ title: 'Points reset' });
      onClose();
      await onDone();
    } catch (err: any) {
      toast({ title: 'Could not reset', description: err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset points — {target?.full_name}</DialogTitle>
          <DialogDescription>
            Sets the {target?.available_points} available points to zero without paying anything. The history stays, and you can undo it from the Payments history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5"><Label>Reason *</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim() || busy} onClick={confirm}>Reset points</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A one-off job the system can't track itself. Points start blocked until admin verifies and releases them.
export function CustomTaskDialog({ employee, open, onClose, onDone }: { employee: any; open: boolean; onClose: () => void; onDone: Done }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', details: '', points: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setForm({ title: '', details: '', points: '' }); }, [open]);
  const add = async () => {
    setBusy(true);
    try {
      await api.employees.adminAddCustomTask(employee.id, { title: form.title, details: form.details, points: Number(form.points) });
      toast({ title: 'Custom task added — points are blocked' });
      onClose();
      await onDone();
    } catch (err: any) {
      toast({ title: 'Could not add task', description: err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add custom task — {employee?.full_name}</DialogTitle>
          <DialogDescription>
            For work the system can't track by itself. The points show up as <b>blocked</b> for the employee. When the task is done and you've verified it, release them from the points history. Points can't be reduced — an unfinished task can only be cancelled.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Task *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Convince Sharma Traders to buy the Nokia 2660 on the platform" /></div>
          <div className="space-y-1.5"><Label>Details</Label><Input value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="optional — follow-ups, deadline…" /></div>
          <div className="space-y-1.5"><Label>Points *</Label><Input type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.title.trim() || !(Number(form.points) > 0) || busy} onClick={add}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
