import { DollarSign, CreditCard, Calendar, TrendingUp, Lock, ShieldCheck, Loader2, BadgeCheck, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { computeOrderBreakdown } from '@/lib/orderBreakdown';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function PayoutDetailsCard() {
  const { toast } = useToast();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ accountHolder: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });

  const load = async () => {
    try {
      const data = await api.profiles.myPayoutDetails();
      if (data && data.vendor_id) {
        setDetails(data);
        setForm({
          accountHolder: data.account_holder || '',
          accountNumber: data.account_number || '',
          ifsc: data.ifsc || '',
          bankName: data.bank_name || '',
          upiId: data.upi_id || ''
        });
      }
    } catch (e) {
      console.error('Failed to load payout details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.accountHolder.trim() || !form.accountNumber.trim() || !form.ifsc.trim()) {
      toast({ title: 'Missing details', description: 'Account holder name, account number and IFSC are required.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const result = await api.profiles.submitPayoutDetails(form);
      setDetails(result);
      toast({ title: 'Payout details saved', description: 'Cashfree has registered this account — admin will verify it before your first payout.' });
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message || 'Please check the details and try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const adminVerified = !!details?.verified_at;
  const cashfreeVerified = details?.cashfree_verification_status === 'VERIFIED';

  if (loading) {
    return (
      <Card className="border-border/50 rounded-2xl">
        <CardContent className="pt-6 flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Payout Bank Details</CardTitle>
            <CardDescription>Where we send your money once an order is fully settled. Verified directly through Cashfree.</CardDescription>
          </div>
          {details?.vendor_id && (
            adminVerified ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Verified — ready for payouts</Badge>
            ) : cashfreeVerified ? (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 gap-1"><Clock3 className="h-3.5 w-3.5" /> Awaiting admin review</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">Cashfree could not verify this account</Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Account Holder Name *</Label>
            <Input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="As per bank records" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bank Name</Label>
            <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Account Number *</Label>
            <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">IFSC Code *</Label>
            <Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} className="font-mono uppercase" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">UPI ID (optional)</Label>
            <Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="yourname@upi" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (details?.vendor_id ? 'Update Details' : 'Save Payout Details')}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Changing your bank details clears any prior verification — a fresh admin review is required before your next payout.
        </p>
      </CardContent>
    </Card>
  );
}

export default function VendorPayouts() {
  const [dbPayouts, setDbPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    paidAmount: 0,
    pendingAmount: 0,
    lastPayoutDate: new Date().toISOString()
  });

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const rfqs = await api.rfqs.list();
        const orders = rfqs.filter((r: any) => ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(r.status));

        const items = orders.map((rfq: any) => {
          const bd = computeOrderBreakdown(rfq);
          // This is the vendor's net take-home (commission already deducted) — the same
          // figure shown on the Earnings ledger and the Admin billing ledger, so it never drifts.
          return {
            id: rfq.id,
            title: rfq.product_name,
            amount: bd.vendorNetPayout,
            status: bd.isSettled ? 'paid' : 'pending',
            created_at: rfq.created_at,
          };
        });

        setDbPayouts(items);
        const total = items.reduce((sum: number, p: any) => sum + p.amount, 0);
        const paid = items.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0);
        setStats({
          totalEarnings: total,
          paidAmount: paid,
          pendingAmount: total - paid,
          lastPayoutDate: items.find((p: any) => p.status === 'paid')?.created_at || new Date().toISOString()
        });
      } catch (e) {
        console.error('Payouts fetch failed', e);
      }
    };
    fetchPayouts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts & Settlement</h1>
        <p className="text-muted-foreground">Track your earnings and payment history</p>
      </div>

      <PayoutDetailsCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(stats.totalEarnings)}</div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(stats.paidAmount)}</div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(stats.pendingAmount)}</div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {/* --secondary is a near-white 96% lightness gray in this theme (meant to pair with
                  the near-black --secondary-foreground, not itself as a foreground color) — this
                  icon was rendering near-white on a near-white background: functionally invisible. */}
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{new Date(stats.lastPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                <p className="text-sm text-muted-foreground">Last Payout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your past settlements and upcoming payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {dbPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Payout History</h3>
              <p className="text-muted-foreground max-w-md">
                Your settlements will appear here as soon as payments are processed for your orders.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbPayouts.map((payout: any) => (
                <div key={payout.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{payout.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payout.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(payout.amount)}</p>
                    <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
