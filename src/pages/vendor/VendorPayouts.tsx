import { DollarSign, CreditCard, Calendar, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/vendor/payouts`);
        if (res.ok) {
          const data = await res.json();
          setDbPayouts(data);
          // Simple aggregation for dashboard
          const total = data.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          setStats(prev => ({ ...prev, totalEarnings: total, pendingAmount: total - prev.paidAmount }));
        }
      } catch (e) {
        console.error('Payouts fetch failed');
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
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{new Date(stats.lastPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                <p className="text-sm text-muted-foreground">Last Payout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your past settlements and upcoming payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Payout History</h3>
            <p className="text-muted-foreground max-w-md">
              Your settlements will appear here as soon as payments are processed for your orders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
