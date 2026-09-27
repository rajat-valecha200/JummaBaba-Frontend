import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';

// "Complete your profile to receive payouts on time" — shown once per login session while the
// employee's payout details are missing. It never blocks the portal; the dashboard keeps a banner.
export function ProfilePrompt() {
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('jb_profile_prompt') === '1'; } catch { /* storage unavailable */ }
    if (seen) return;
    api.employees.myProfile().then((d) => {
      if (d?.payout && !d.payout.complete) { setMissing(d.payout.missing || []); setOpen(true); }
      try { sessionStorage.setItem('jb_profile_prompt', '1'); } catch { /* ignore */ }
    }).catch(() => { /* a nicety — never get in the way */ });
  }, []);

  const labels: Record<string, string> = { date_of_birth: 'date of birth', pan: 'PAN', account_holder: 'account holder name', account_number: 'account number', ifsc: 'IFSC' };
  if (pathname === '/employee/profile') return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2"><ShieldCheck className="h-7 w-7 text-primary" /></div>
          <DialogTitle className="text-center text-xl">Complete your profile</DialogTitle>
          <DialogDescription className="text-center">
            Add your bank and PAN details so your payouts reach you on time. Without them we can't pay the points you earn.
          </DialogDescription>
        </DialogHeader>
        {missing.length > 0 && <p className="text-sm text-center text-muted-foreground">Still needed: {missing.map((m) => labels[m] || m).join(', ')}</p>}
        <DialogFooter className="sm:flex-col gap-2 sm:space-x-0">
          <Button className="w-full" onClick={() => { setOpen(false); navigate('/employee/profile'); }}>Complete profile</Button>
          <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
