import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Package, ShoppingCart, ShoppingBag, FileText, TrendingUp, Plus, Eye, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { SalesChart } from '@/components/b2b/SalesChart';
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
        // A Direct Order isn't a real order until the seller accepts AND the buyer pays
        // (status only flips to 'ordered' at that point) — the old blanket
        // `|| rfq.is_direct_order === true` pulled every just-placed, unpaid Direct Order in
        // here too, mixed in with real orders under a "Recent Orders" heading. Same bug already
        // fixed in VendorOrders.tsx's own fetch and in api.ts's orders.listVendor().
        setRealOrders(
          rfqData
            .filter((rfq: any) => ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(rfq.status))
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

  const displayedRfqs = Array.isArray(liveRfqs)
    ? liveRfqs.filter((rfq: any) => rfq.status === 'pending' && rfq.moderation_status === 'forwarded' && !rfq.vendor_status && rfq.is_direct_order !== true).slice(0, 3)
    : [];
  // Direct Orders never show up in the RFQ tab and only reach the Orders tab once paid — this
  // count (mirrored by the "Direct Orders" nav link's own count) is otherwise invisible from the
  // dashboard entirely. Counts every one still awaiting this vendor's Accept/Decline.
  const directOrdersCount = Array.isArray(liveRfqs)
    ? liveRfqs.filter((rfq: any) => rfq.is_direct_order === true && rfq.direct_order_status === 'pending_seller_accept').length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user?.status === 'rejected' && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-destructive/20 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              Account Registration Rejected
            </h3>
            <p className="text-muted-foreground mt-1">
              Your vendor application was not approved for the following reason:
            </p>
            <div className="mt-3 p-3 bg-white/50 border border-destructive/10 rounded-lg text-sm font-medium italic text-destructive/80">
              "{user?.rejection_reason || 'Incomplete documentation or invalid details.'}"
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Please update your <Link to="/vendor/profile" className="text-primary hover:underline font-bold">Business Profile</Link> and ensure all documents are clear and valid. After updating, your profile will be re-submitted for moderation.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground italic">Welcome back, <span className="text-primary font-semibold">{user?.business_name || user?.full_name || 'Partner'}</span></p>
        </div>
        {user?.status === 'approved' ? (
          <Button asChild>
            <Link to="/vendor/products?action=add"><Plus className="h-4 w-4 mr-2" />Add Product</Link>
          </Button>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />Add Product
          </Button>
        )}
      </div>

      {/* Capped at 3 columns, not 5 — 5 narrow columns left too little width for a label like
          "TOTAL REVENUE" or a real currency value, so the value wrapped mid-number instead of
          fitting on one line. 5 cards over 3 columns just wraps to a second (2-card) row. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Total Products" value={stats?.products || 0} icon={Package} trend={{ value: 8, isPositive: true }} />
        {/* --secondary and --accent are both a near-white 96% lightness gray in this theme (meant
            to pair with their near-black *-foreground counterparts, not as a foreground color
            themselves) — text-secondary/text-accent icons were rendering near-white on a
            near-white background: functionally invisible. Swapped for real visible colors. */}
        <StatsCard title="Orders Received" value={stats?.orders || 0} icon={ShoppingCart} iconClassName="bg-indigo-500/10 text-indigo-500" />
        <StatsCard title="RFQs Received" value={stats?.rfqs || 0} icon={FileText} iconClassName="bg-cyan-500/10 text-cyan-500" />
        <StatsCard title="Direct Orders" value={directOrdersCount} icon={ShoppingBag} iconClassName="bg-orange-500/10 text-orange-500" />
        <StatsCard title="Revenue" value={formatPrice(stats?.revenue || 0)} icon={TrendingUp} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/orders">View All</Link></Button>
          </CardHeader>
          {/* shadcn's CardContent defaults to pt-0 (it assumes the CardHeader above already
              provides bottom spacing) — but this header's own py-4 plus its border-b sits right
              at the boundary, so the first row's box was landing almost flush against it. */}
          <CardContent className="pt-4">
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

        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg">Pending RFQs</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/rfqs">View All</Link></Button>
          </CardHeader>
          {/* shadcn's CardContent defaults to pt-0 (it assumes the CardHeader above already
              provides bottom spacing) — but this header's own py-4 plus its border-b sits right
              at the boundary, so the first row's box was landing almost flush against it. */}
          <CardContent className="pt-4">
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
