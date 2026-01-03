import { DollarSign, CreditCard, Calendar, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/data/mockData';

export default function VendorPayouts() {
  // Mock payout data (disabled for now)
  const payoutData = {
    totalEarnings: 3500000,
    paidAmount: 2800000,
    pendingAmount: 700000,
    lastPayoutDate: '2024-01-15',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts & Settlement</h1>
        <p className="text-muted-foreground">Track your earnings and payment history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(payoutData.totalEarnings)}</div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
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
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(payoutData.paidAmount)}</div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
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
              <div className="p-2 bg-warning/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatPrice(payoutData.pendingAmount)}</div>
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
                <div className="text-2xl font-bold">{new Date(payoutData.lastPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
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
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Payout and settlement features are currently under development. 
              You'll be able to track your earnings, view payment history, and manage bank details here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
