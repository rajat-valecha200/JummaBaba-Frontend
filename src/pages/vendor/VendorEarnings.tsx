import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Wallet, Download, CheckCircle, Clock } from 'lucide-react';

export default function VendorEarnings() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    clearedBalance: 0,
    escrowHeld: 0,
    totalPlatformFees: 0
  });

  useEffect(() => {
    const fetchVendorLedger = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jummababa_token')}`
          }
        });
        if (res.ok) {
          const rfqs = await res.json();
          // Filter to only include orders assigned to the logged in vendor
          // (role check / ownership is handled backend-side)
          const vendorOrders = rfqs.filter((r: any) => ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(r.status));
          
          let cleared = 0;
          let held = 0;
          let fees = 0;

          const items = vendorOrders.map((rfq: any) => {
            const resp = typeof rfq.response_details === 'string' ? JSON.parse(rfq.response_details) : (rfq.response_details || {});
            const price = Number(resp.price) || Number(rfq.target_price) || 0;
            const quantity = Number(rfq.quantity) || 0;
            const grossAmount = price * quantity;
            
            const commission = resp.commission_breakdown?.totalCommission || (grossAmount * 0.09);
            const payout = grossAmount - commission;

            if (rfq.status === 'completed') {
              cleared += payout;
            } else {
              held += payout;
            }
            fees += commission;

            return {
              id: rfq.id,
              productName: rfq.product_name,
              grossAmount,
              payout,
              commission,
              status: rfq.status,
              createdAt: rfq.created_at
            };
          });

          setLedgers(items);
          setTotals({
            clearedBalance: cleared,
            escrowHeld: held,
            totalPlatformFees: fees
          });
        }
      } catch (err) {
        console.error('Failed to load vendor ledger earnings', err);
      }
    };
    fetchVendorLedger();
  }, []);

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vendor Sourcing Earnings</h1>
        <p className="text-slate-500 mt-2">Manage your cleared payments, current escrow holds, and platform fees statements.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-lg border-emerald-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cleared Balance</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.clearedBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for payout extraction</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Escrow Holds</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.escrowHeld)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending delivery completion confirmation</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Platform Service Fees</CardTitle>
            <Badge variant="secondary">Commission Split</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(totals.totalPlatformFees)}</div>
            <p className="text-xs text-muted-foreground mt-1">Value deducted for platform operation services</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
          <CardTitle className="text-lg">Fulfillment Payments Ledger</CardTitle>
          <CardDescription>Breakdown statement of payout cleared or pending escrow approval.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead>Placement Date</TableHead>
                <TableHead className="text-right">Order Gross</TableHead>
                <TableHead className="text-right">Platform Comm</TableHead>
                <TableHead className="text-right">Expected Payout</TableHead>
                <TableHead className="text-center">Clearing Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No order transactions recorded.
                  </TableCell>
                </TableRow>
              ) : (
                ledgers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-slate-600">#{row.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-slate-800">{row.productName}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{new Date(row.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">{formatPrice(row.grossAmount)}</TableCell>
                    <TableCell className="text-right text-slate-500 font-medium">-{formatPrice(row.commission)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{formatPrice(row.payout)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.status === 'completed' ? 'default' : 'secondary'} className={row.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                        {row.status === 'completed' ? 'Cleared' : 'Escrow Hold'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
