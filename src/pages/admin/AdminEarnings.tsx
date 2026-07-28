import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import { Landmark, TrendingUp, Receipt, Award, Loader2, Wallet, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { computeOrderBreakdown } from '@/lib/orderBreakdown';
import { useToast } from '@/hooks/use-toast';

export default function AdminEarnings() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const releaseInFlight = useRef<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchEarnings = async () => {
    try {
      const data = await api.rfqs.list().catch(() => null);
      if (data) {
        setRfqs(data.filter((r: any) => ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(r.status)));
      }
    } catch (err) {
      console.error('Failed to load platform billing ledgers', err);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleRelease = async (id: string) => {
    // Guard synchronously — a fast double-tap can fire this twice before React re-renders
    // with the button disabled, since setReleasingId(id) below only takes effect next render.
    if (releaseInFlight.current === id) return;
    releaseInFlight.current = id;
    try {
      setReleasingId(id);
      const result = await api.rfqs.releasePayment(id);
      if (result?.alreadySettled) {
        toast({ title: 'Already Released', description: 'This order was already settled — no further action needed.' });
      } else {
        toast({ title: 'Payment Released', description: 'Vendor wallet credited successfully.' });
      }
      await fetchEarnings();
    } catch (err: any) {
      toast({ title: 'Failed to release payment', description: err.message, variant: 'destructive' });
    } finally {
      releaseInFlight.current = null;
      setReleasingId(null);
    }
  };

  const ledgers = rfqs.map((rfq) => ({ rfq, bd: computeOrderBreakdown(rfq) }));
  const totals = ledgers.reduce((acc, { bd }) => ({
    buyerPaid: acc.buyerPaid + bd.buyerTotalPaid,
    gst: acc.gst + bd.gst,
    commission: acc.commission + bd.platformCommission,
    pendingSettlement: acc.pendingSettlement + (bd.isSettled ? 0 : bd.vendorNetPayout),
  }), { buyerPaid: 0, gst: 0, commission: 0, pendingSettlement: 0 });

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Platform Billing & Earnings Ledger</h1>
        <p className="text-slate-500 mt-2">Per-order breakdown of buyer payments, GST, platform commission, and vendor settlement.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-lg border-emerald-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Buyer Payments</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.buyerPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross amount collected from buyers</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total GST Collected</CardTitle>
            <Receipt className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.gst)}</div>
            <p className="text-xs text-muted-foreground mt-1">18% GST across all orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-indigo-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Platform Commission</CardTitle>
            <Award className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.commission)}</div>
            <p className="text-xs text-muted-foreground mt-1">Service fee splits (8%-10%)</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-rose-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Vendor Settlement</CardTitle>
            <Landmark className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.pendingSettlement)}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered orders awaiting your release</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
          <CardTitle className="text-lg">Ledger Transactions</CardTitle>
          <CardDescription>Every order's buyer payment, tax, and commission split — click an order for the full audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Buyer Paid</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Vendor Net</TableHead>
                <TableHead className="text-center">Settlement</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No sourcing transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                ledgers.map(({ rfq, bd }) => {
                  const isDelivered = rfq.status === 'completed';
                  return (
                    <TableRow
                      key={rfq.id}
                      onClick={() => navigate(`/admin/rfqs/${rfq.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell className="font-mono text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 text-primary hover:underline">
                          <FileText className="h-3 w-3" /> #{rfq.id.substring(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{rfq.buyer_name || 'Buyer'}</TableCell>
                      <TableCell className="font-medium text-slate-800">{rfq.vendor_business_name || 'Seller'}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-800">{formatPrice(bd.buyerTotalPaid)}</TableCell>
                      <TableCell className="text-right text-amber-600 font-semibold">{formatPrice(bd.gst)}</TableCell>
                      <TableCell className="text-right text-indigo-600 font-semibold">{formatPrice(bd.platformCommission)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">{formatPrice(bd.vendorNetPayout)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "font-bold text-[10px] uppercase tracking-wider",
                          bd.isSettled ? "bg-emerald-500 text-white" : isDelivered ? "bg-amber-500 text-white" : "bg-slate-400 text-white"
                        )}>
                          {bd.isSettled ? 'Settled' : isDelivered ? 'Pending Settlement' : 'Pending Delivery'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isDelivered && !bd.isSettled ? (
                          <Button
                            size="sm"
                            onClick={() => handleRelease(rfq.id)}
                            disabled={releasingId === rfq.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-7 rounded-lg"
                          >
                            {releasingId === rfq.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wallet className="h-3 w-3 mr-1" />}
                            Release
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
