import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  Package, 
  ShoppingCart, 
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
  confirmed: 'bg-secondary/10 text-secondary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  responded: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [liveRfqs, setLiveRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const [statsData, rfqData, catRes, prodData] = await Promise.all([
          api.stats.get('buyer'),
          api.rfqs.list(),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories`),
          api.products.list('approved')
        ]);
        setStats(statsData);
        setLiveRfqs(rfqData);
        if (catRes.ok) setDbCategories(await catRes.json());
        setDbProducts(prodData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardContent();
  }, []);

  const recentOrders = []; // Buyer orders not yet implemented in backend
  const displayedRfqs = liveRfqs.length > 0 ? liveRfqs.slice(0, 3) : [];
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
        <StatsCard
          title="RFQs Sent"
          value={stats?.rfqs || 0}
          icon={FileText}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title="Messages"
          value={stats?.messages || 0}
          icon={MessageSquare}
          iconClassName="bg-accent/10 text-accent"
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 border-b">
            <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Link to="/buyer/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {order.items[0].productName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">{formatPrice(order.totalAmount)}</p>
                    <Badge className={`${statusColors[order.status]} text-xs`} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent RFQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 border-b">
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
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Account Management</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/post-requirement">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>New RFQ</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link to="/buyer/cart">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
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
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span>Support</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My RFQs - Full Width Row */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">My Active RFQs</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link to="/buyer/rfqs">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
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
