import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Landmark, TrendingUp, ShieldAlert, Award } from 'lucide-react';

export default function AdminEarnings() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPlatformVolume: 0,
    totalCommissions: 0,
    activeEscrow: 0
  });

  useEffect(() => {
    // Fetch escrow ledgers and payouts information
    const fetchEarnings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jummababa_token')}`
          }
        });
        if (res.ok) {
          const rfqs = await res.json();
          // Filter ordered/completed sourcing items to build platform billing ledger
          const ledgerItems = rfqs.filter((r: any) => ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(r.status));
          
          let totalVolume = 0;
          let totalComm = 0;
          let escrowHeld = 0;

          const formattedLedgers = ledgerItems.map((rfq: any) => {
            const resp = typeof rfq.response_details === 'string' ? JSON.parse(rfq.response_details) : (rfq.response_details || {});
            const unitPrice = Number(resp.price) || Number(rfq.target_price) || 0;
            const quantity = Number(rfq.quantity) || 0;
            const orderAmount = unitPrice * quantity;
            
            // Commission formula fallback clamped at 8-10%
            const rawComm = orderAmount * 0.09;
            const commission = rfq.invoice_released 
              ? (resp.commission_breakdown?.totalCommission || rawComm)
              : rawComm;
            
            totalVolume += orderAmount;
            totalComm += commission;

            if (rfq.status !== 'completed') {
              escrowHeld += orderAmount;
            }

            return {
              id: rfq.id,
              buyerName: rfq.buyer_name || 'Buyer',
              vendorName: rfq.vendor_business_name || 'Seller',
              productName: rfq.product_name,
              amount: orderAmount,
              commission,
              netPayout: orderAmount - commission,
              status: rfq.status,
              released: rfq.invoice_released
            };
          });

          setLedgers(formattedLedgers);
          setStats({
            totalPlatformVolume: totalVolume,
            totalCommissions: totalComm,
            activeEscrow: escrowHeld
          });
        }
      } catch (err) {
        console.error('Failed to load platform billing ledgers', err);
      }
    };
    fetchEarnings();
  }, []);

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Platform Billing & Earnings Ledger</h1>
        <p className="text-slate-500 mt-2">Mediator transactions summary, platform splits, and escrow funds monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-lg border-emerald-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total GMV Volume</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(stats.totalPlatformVolume)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross marketplace value managed</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-indigo-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Platform Revenue</CardTitle>
            <Award className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform service fee splits (8%-10%)</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-500/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Funds in Escrow</CardTitle>
            <Landmark className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{formatPrice(stats.activeEscrow)}</div>
            <p className="text-xs text-muted-foreground mt-1">Secured funds awaiting dispatch confirmation</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
          <CardTitle className="text-lg">Ledger Transactions</CardTitle>
          <CardDescription>Comprehensive ledger of order value splits and payment states.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Order Gross</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
                <TableHead className="text-right">Seller Payout</TableHead>
                <TableHead className="text-center">Escrow Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sourcing transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                ledgers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-slate-600">#{row.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-slate-800">{row.buyerName}</TableCell>
                    <TableCell className="font-medium text-slate-800">{row.vendorName}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">{formatPrice(row.amount)}</TableCell>
                    <TableCell className="text-right text-indigo-600 font-semibold">{formatPrice(row.commission)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-semibold">{formatPrice(row.netPayout)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.status === 'completed' ? 'default' : 'secondary'} className={row.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                        {row.status === 'completed' ? 'Settled to Seller' : 'Held in Escrow'}
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
