import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { ProductCard } from '@/components/b2b/ProductCard';
import { CategoryCard } from '@/components/b2b/CategoryCard';
import { 
  formatPrice, 
  formatNumber,
  cn
} from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  ordered: 'bg-indigo-500/10 text-indigo-500',
  // --secondary is a near-white 96% lightness gray in this theme (meant to pair with the
  // near-black --secondary-foreground, not itself as a foreground color) — this badge text was
  // rendering near-white on a near-white background: functionally invisible.
  confirmed: 'bg-indigo-500/10 text-indigo-500',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  responded: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [liveRfqs, setLiveRfqs] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  const fetchDashboardContent = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsData, rfqData, ordersData, catRes, prodData] = await Promise.all([
        api.stats.get('buyer'),
        api.rfqs.list(),
        api.orders.listBuyer(),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories`),
        api.products.list('approved')
      ]);
      setStats(statsData);
      setLiveRfqs(rfqData);
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 3) : []);
      if (catRes.ok) setDbCategories(await catRes.json());
      setDbProducts(prodData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardContent();
    const interval = setInterval(() => fetchDashboardContent(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Direct Orders never show up in the RFQ tab and were previously entirely absent from "Active
  // RFQs" widgets' intent (they're not a negotiation) — kept in liveRfqs for stats, but not mixed
  // into the RFQ-specific lists below.
  const displayedRfqs = liveRfqs.length > 0 ? liveRfqs.filter((rfq: any) => !rfq.is_direct_order).slice(0, 3) : [];
  const featuredProducts = dbProducts.slice(0, 4);
  const topCategories = dbCategories.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.full_name || user?.email.split('@')[0]}!</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Here's what's happening with your account</p>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Orders"
          value={stats?.orders || 0}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
        />
        {/* --secondary and --accent are both a near-white 96% lightness gray in this theme
            (meant to pair with their near-black *-foreground counterparts, not as a foreground
            color themselves) — these icons were rendering near-white on a near-white background:
            functionally invisible. Swapped for real visible colors. */}
        <StatsCard
          title="RFQs Sent"
          value={stats?.rfqs || 0}
          icon={FileText}
          iconClassName="bg-indigo-500/10 text-indigo-500"
        />
        <StatsCard
          title="Messages"
          value={stats?.messages || 0}
          icon={MessageSquare}
          iconClassName="bg-cyan-500/10 text-cyan-500"
        />
        <StatsCard
          title="Total Spent"
          value={formatPrice(stats?.totalSpent || 0)}
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      {/* Main Content - Orders & RFQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Link to="/buyer/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {recentOrders.length > 0 ? recentOrders.map(order => (
                <div key={order.id} className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{order.product_name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Qty: {order.quantity} {order.unit}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">{formatPrice(Number(order.target_price) * Number(order.quantity))}</p>
                    <Badge className={`${statusColors[order.status] || 'bg-muted'} text-xs`} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent orders yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent RFQs */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Active RFQs</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Link to="/buyer/rfqs">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {displayedRfqs.length > 0 ? displayedRfqs.map(rfq => (
                <div key={rfq.id} className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{rfq.product_name || rfq.productName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {rfq.quantity} {rfq.unit}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge className={`${statusColors[rfq.status] || 'bg-muted'} text-xs`} variant="secondary">
                      {rfq.status}
                    </Badge>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {rfq.responses?.length || 0} responses
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No active RFQs found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Account Management</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/post-requirement">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>New RFQ</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/buyer/direct-orders">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <span>Direct Orders</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/buyer/cart">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                <span>My Cart</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                <span>Marketplace</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/buyer/messages">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                <span>Support</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My RFQs - Full Width Row */}
      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">My Active RFQs</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link to="/buyer/rfqs">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRfqs.length > 0 ? displayedRfqs.map(rfq => (
              <div key={rfq.id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
                <p className="font-medium text-sm truncate">{rfq.product_name || rfq.productName}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">{rfq.quantity} {rfq.unit}</span>
                  <Badge className={`${statusColors[rfq.status] || 'bg-muted'} text-[10px]`} variant="secondary">
                    {rfq.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm col-span-full">No active RFQs found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
