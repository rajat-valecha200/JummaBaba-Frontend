import { useEffect, useState } from 'react';
import { BadgeCheck, Clock, Loader2, Pencil, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const cardCls = 'border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden';
const headCls = 'border-b border-border/50 bg-slate-50/50 px-6 py-4';
const emptyPayout = { date_of_birth: '', pan: '', account_holder: '', account_number: '', confirm_account_number: '', ifsc: '', bank_name: '', upi_id: '' };

// The employee's own profile: contact details and the payout details admin needs to pay them.
// Everything the employee filled in comes back pre-filled (it is their own data). Changing the
// account number asks them to confirm it by typing it again.
export default function EmployeeProfile() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [basic, setBasic] = useState({ full_name: '', phone: '', location: '' });
  const [payout, setPayout] = useState(emptyPayout);

  const fill = (d: any) => {
    setData(d);
    setBasic({ full_name: d.profile.full_name || '', phone: d.profile.phone || '', location: d.profile.location || '' });
    setEditing(!d.payout.complete); // first time (or still incomplete): start in edit mode; afterwards read-only until the pencil is tapped
    setPayout({ ...emptyPayout, date_of_birth: d.payout.date_of_birth || '', pan: d.payout.pan || '', account_holder: d.payout.account_holder || '', account_number: d.payout.account_number || '', ifsc: d.payout.ifsc || '', bank_name: d.payout.bank_name || '', upi_id: d.payout.upi_id || '' });
  };
  useEffect(() => {
    api.employees.myProfile().then(fill)
      .catch((e) => toast({ title: 'Could not load profile', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <p className="text-muted-foreground">Could not load your profile. Please refresh.</p>;

  const pd = data.payout;
  const original = { date_of_birth: pd.date_of_birth || '', pan: pd.pan || '', account_holder: pd.account_holder || '', account_number: pd.account_number || '', ifsc: pd.ifsc || '', bank_name: pd.bank_name || '', upi_id: pd.upi_id || '' };
  const dirty = basic.full_name !== (data.profile.full_name || '') || basic.phone !== (data.profile.phone || '') || basic.location !== (data.profile.location || '')
    || (Object.keys(original) as (keyof typeof original)[]).some((k) => String(payout[k] ?? '') !== original[k]);
  const sensitiveChanged = pd.complete && (['date_of_birth', 'pan', 'account_holder', 'account_number', 'ifsc', 'upi_id'] as const).some((k) => String(payout[k] ?? '') !== original[k]);
  const cancel = () => { fill(data); setEditing(false); };
  const accountChanged = payout.account_number.replace(/\s/g, '') !== String(pd.account_number || '');
  const save = async () => {
    if (accountChanged && payout.account_number.replace(/\s/g, '') !== payout.confirm_account_number.replace(/\s/g, '')) {
      toast({ title: 'Account numbers do not match', description: 'Type the account number again in the confirm box.', variant: 'destructive' });
      return;
    }
    const p: any = { date_of_birth: payout.date_of_birth, account_holder: payout.account_holder, ifsc: payout.ifsc, bank_name: payout.bank_name, upi_id: payout.upi_id };
    if (payout.pan.trim()) p.pan = payout.pan;
    if (payout.account_number.trim()) { p.account_number = payout.account_number; if (accountChanged) p.confirm_account_number = payout.confirm_account_number; }
    setSaving(true);
    try {
      fill(await api.employees.updateMyProfile({ ...basic, payout: p }));
      toast({ title: 'Profile saved' });
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const status = !pd.complete
    ? <Badge className="bg-destructive/10 text-destructive"><ShieldAlert className="h-3 w-3 mr-1" />Incomplete — payouts are on hold</Badge>
    : pd.verified
      ? <Badge className="bg-emerald-500/10 text-emerald-600"><BadgeCheck className="h-3 w-3 mr-1" />Verified — you're ready to be paid</Badge>
      : <Badge className="bg-amber-500/10 text-amber-600"><Clock className="h-3 w-3 mr-1" />With the team for verification</Badge>;
  const missingLabels: Record<string, string> = { date_of_birth: 'Date of birth', pan: 'PAN', account_holder: 'Account holder name', account_number: 'Account number', ifsc: 'IFSC' };
  const F = (label: string, node: React.ReactNode, hint?: string) => (<div className="space-y-1.5"><Label>{label}</Label>{node}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Keep your details complete so your payouts reach you on time.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status}
          {!editing && (
            <Button size="icon" variant="outline" title="Edit my details" aria-label="Edit my details" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {!pd.complete && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 px-4 py-3 text-sm">
          Still needed: <b>{pd.missing.map((m: string) => missingLabels[m] || m).join(', ')}</b>. We can only pay you once these are filled in and verified.
        </div>
      )}

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Your details</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6">
         <fieldset disabled={!editing} className="grid sm:grid-cols-2 gap-5 disabled:opacity-100 [&_input:disabled]:bg-muted/40 [&_input:disabled]:text-foreground [&_input:disabled]:opacity-100 [&_input:disabled]:cursor-default">
          {F('Full name', <Input value={basic.full_name} onChange={(e) => setBasic({ ...basic, full_name: e.target.value })} />)}
          {F('Email (your login)', <Input value={data.profile.email} disabled />)}
          {F('Mobile number', <Input inputMode="numeric" value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} />)}
          {F('City / location', <Input value={basic.location} onChange={(e) => setBasic({ ...basic, location: e.target.value })} />)}
         </fieldset>
        </CardContent>
      </Card>

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Payout details</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <p className="text-xs text-muted-foreground">Used only to pay you. If you later change your bank account or PAN, the team has to verify it again before your next payout.</p>
          <fieldset disabled={!editing} className="grid sm:grid-cols-2 gap-5 [&_input:disabled]:bg-muted/40 [&_input:disabled]:text-foreground [&_input:disabled]:opacity-100 [&_input:disabled]:cursor-default">
            {F('Date of birth *', <Input type="date" value={payout.date_of_birth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPayout({ ...payout, date_of_birth: e.target.value })} />, 'You must be 18 or older')}
            {F('PAN *', <Input className="uppercase" maxLength={10} placeholder="ABCDE1234F" value={payout.pan} onChange={(e) => setPayout({ ...payout, pan: e.target.value.toUpperCase() })} />)}
            {F('Account holder name *', <Input value={payout.account_holder} onChange={(e) => setPayout({ ...payout, account_holder: e.target.value })} />, 'Exactly as on your bank account')}
            {F('Bank name', <Input value={payout.bank_name} onChange={(e) => setPayout({ ...payout, bank_name: e.target.value })} placeholder={editing ? 'optional' : '—'} />)}
            {F('Account number *', <Input inputMode="numeric" value={payout.account_number} onChange={(e) => setPayout({ ...payout, account_number: e.target.value.replace(/[^\d\s]/g, '') })} />)}
            {editing && F('Confirm account number', <Input inputMode="numeric" disabled={!accountChanged} placeholder={accountChanged ? 'Type it again' : ''} value={payout.confirm_account_number} onChange={(e) => setPayout({ ...payout, confirm_account_number: e.target.value.replace(/[^\d\s]/g, '') })} />, accountChanged ? undefined : 'Only needed when you change the account number')}
            {F('IFSC *', <Input className="uppercase" maxLength={11} placeholder="HDFC0001234" value={payout.ifsc} onChange={(e) => setPayout({ ...payout, ifsc: e.target.value.toUpperCase() })} />)}
            {F('UPI id', <Input placeholder={editing ? 'optional — name@bank' : '—'} value={payout.upi_id} onChange={(e) => setPayout({ ...payout, upi_id: e.target.value })} />)}
          </fieldset>
          {editing && sensitiveChanged && (
            <p className="text-xs rounded-lg bg-amber-500/5 border border-amber-500/30 px-3 py-2">You've changed bank, PAN or identity details. The team will need to verify them again before your next payout.</p>
          )}
          {editing && (
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              {pd.complete && <Button variant="outline" onClick={cancel} disabled={saving} className="w-full sm:w-auto">Cancel</Button>}
              <Button onClick={save} disabled={saving || (pd.complete && !dirty)} className="w-full sm:w-auto">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save profile</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
