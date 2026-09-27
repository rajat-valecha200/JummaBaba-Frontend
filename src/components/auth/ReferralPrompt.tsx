import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { normalizeReferralCode } from '@/lib/referral';

// "Do you have a referral code?" — shown to a buyer/seller who registered without one, on their
// first few visits, and only while the admin-set window after registration is still open (after
// that a code can no longer be added, so there's nothing to ask). Adding a code is one-time.
const MAX_SHOWS = 3;

export function ReferralPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [code, setCode] = useState('');
  const [check, setCheck] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !['buyer', 'vendor'].includes(user.role)) return;
    const key = `jb_ref_prompt_${user.id}`;
    let shown = 0;
    try { shown = Number(localStorage.getItem(key) || 0); } catch { /* storage unavailable */ }
    if (shown >= MAX_SHOWS) return;
    api.employees.referralStatus().then((s) => {
      if (!s.eligible) return;
      setDaysLeft(s.days_left);
      setOpen(true);
      try { localStorage.setItem(key, String(shown + 1)); } catch { /* ignore */ }
    }).catch(() => { /* prompt is optional — never get in the user's way */ });
  }, [user?.id]);

  useEffect(() => {
    if (!code) { setCheck('idle'); return; }
    setCheck('checking');
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await api.employees.validateReferral(code);
        if (cancelled) return;
        setCheck(r.valid ? 'valid' : 'invalid');
        setName(r.employee_name || '');
      } catch { if (!cancelled) setCheck('idle'); }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [code]);

  const apply = async () => {
    setSaving(true);
    try {
      await api.employees.attachReferral(code);
      toast({ title: 'Referral code added', description: 'Thanks — you\'re all set.' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Could not add code', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Do you have a referral code?</DialogTitle>
          <DialogDescription>
            If someone from JummaBaba referred you, enter their code so they're credited.
            You can add it for {daysLeft} more day{daysLeft === 1 ? '' : 's'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="relative">
            <Input value={code} onChange={(e) => setCode(normalizeReferralCode(e.target.value))} placeholder="e.g. JBK7M2XQ" maxLength={12} className="uppercase pr-10" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {check === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {check === 'valid' && <CheckCircle2 className="h-4 w-4 text-success" />}
              {check === 'invalid' && <XCircle className="h-4 w-4 text-destructive" />}
            </span>
          </div>
          {check === 'valid' && <p className="text-xs text-success">Referred by {name || 'a JummaBaba partner'}</p>}
          {check === 'invalid' && <p className="text-xs text-destructive">This code isn't valid.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>No, skip</Button>
          <Button onClick={apply} disabled={check !== 'valid' || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
