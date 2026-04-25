import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Package, ShoppingCart, FileText, TrendingUp, Plus, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { formatPrice } from '@/lib/utils';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [liveRfqs, setLiveRfqs] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, rfqData] = await Promise.all([
          api.profiles.meStats(),
          api.rfqs.list()
        ]);
        setStats(statsData);
        setLiveRfqs(rfqData);
        setRealOrders(
          rfqData
            .filter((rfq: any) => ['confirmed', 'shipped', 'delivered'].includes(rfq.vendor_status))
            .slice(0, 3)
        );
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayedRfqs = Array.isArray(liveRfqs) && liveRfqs.length > 0 ? liveRfqs.slice(0, 3) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground italic">Welcome back, <span className="text-primary font-semibold">{user?.business_name || user?.full_name || 'Partner'}</span></p>
        </div>
        <Button asChild>
          <Link to="/vendor/products"><Plus className="h-4 w-4 mr-2" />Add Product</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={stats?.products || 0} icon={Package} trend={{ value: 8, isPositive: true }} />
        <StatsCard title="Orders Received" value={stats?.orders || 0} icon={ShoppingCart} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="RFQs Received" value={stats?.rfqs || 0} icon={FileText} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Revenue" value={formatPrice(stats?.revenue || 0)} icon={TrendingUp} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/orders">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realOrders.length > 0 ? realOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="font-medium">{order.order_number || `RFQ-${order.id.slice(0, 8).toUpperCase()}`}</p><p className="text-sm text-muted-foreground">{order.product_name}</p></div>
                  <Badge variant="secondary">{order.vendor_status || order.status}</Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent orders yet</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending RFQs</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/rfqs">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayedRfqs.length > 0 ? displayedRfqs.map(rfq => (
                <div key={rfq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="font-medium">{rfq.product_name || rfq.productName}</p><p className="text-sm text-muted-foreground">{rfq.quantity} {rfq.unit}</p></div>
                  <Button size="sm" asChild><Link to="/vendor/rfqs">Respond</Link></Button>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No RFQs found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
