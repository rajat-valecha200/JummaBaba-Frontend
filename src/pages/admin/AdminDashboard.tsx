import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Users, Package, Building, TrendingUp, CheckCircle, XCircle, Clock, Loader2, Eye, ShieldAlert, MessageCircle, ShoppingCart, FileText, ArrowRight } from 'lucide-react';
import { VendorDetailsDialog } from '@/components/admin/VendorDetailsDialog';
import { normalizeProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { SalesChart } from '@/components/b2b/SalesChart';
import { formatPrice } from '@/lib/utils';
import { ProductPreviewDialog } from '@/components/admin/ProductPreviewDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [recentRfqs, setRecentRfqs] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productPreviewOpen, setProductPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rejectProductDialogOpen, setRejectProductDialogOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const cats = await api.categories.list();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchDeps();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, vendorsData, productsData, rfqsData, ordersData] = await Promise.all([
        api.admin.getStats(),
        api.profiles.list('vendor', 'pending'),
        api.products.list('pending'),
        api.rfqs.list(),
        api.orders.listBuyer()
      ]);
      setStats(statsData);
      setPendingVendors(vendorsData.map((v: any) => normalizeProfile(v)));
      setPendingProducts(productsData.map((p: any) => ({
        ...p,
        categoryId: p.category_id,
        pricingSlabs: typeof p.pricing_slabs === 'string' ? JSON.parse(p.pricing_slabs) : p.pricing_slabs || [],
      })));
      setRecentRfqs(Array.isArray(rfqsData) ? rfqsData.filter((r: any) => !r.is_direct_order).slice(0, 5) : []);
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [actioningVendorId, setActioningVendorId] = useState<string | null>(null);
  // Synchronous guards — a fast double-tap can fire a handler twice before React re-renders
  // with the button disabled, since the setState calls below only take effect next render.
  const vendorActionGuard = useRef<string | null>(null);
  const productActionGuard = useRef<string | null>(null);

  const handleVendorStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    if (vendorActionGuard.current === id) return;
    vendorActionGuard.current = id;
    setActioningVendorId(id);
    try {
      let updated;
      if (reason === 'reset') {
        updated = await api.profiles.updateStatus(id, 'pending');
        toast({ title: 'Vendor reset to Pending' });
      } else {
        updated = await api.profiles.updateStatus(id, status, reason);
        toast({ title: `Vendor ${status === 'approved' ? 'Approved' : 'Rejected'}` });
      }

      // Update local state if the sheet is open
      if (selectedVendor && selectedVendor.id === id) {
        setSelectedVendor({ ...selectedVendor, status: updated.status, rejection_reason: updated.rejection_reason });
      }

      fetchData(); // Refresh all data
    } catch (error: any) {
      toast({ title: 'Operation Failed', description: error.message, variant: 'destructive' });
    } finally {
      vendorActionGuard.current = null;
      setActioningVendorId(null);
    }
    setDetailsOpen(false);
  };

  const [actioningProductId, setActioningProductId] = useState<string | null>(null);

  const handleProductStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    if (productActionGuard.current === id) return;
    productActionGuard.current = id;
    try {
      setActioningProductId(id);
      await api.products.updateStatus(id, status, reason);
      toast({ title: `Product ${status === 'approved' ? 'Approved' : 'Rejected'}` });
      setProductPreviewOpen(false);
      setRejectProductDialogOpen(false);
      await fetchData(); // Refresh all data
    } catch (error: any) {
      toast({ title: 'Operation Failed', description: error.message, variant: 'destructive' });
    } finally {
      productActionGuard.current = null;
      setActioningProductId(null);
    }
  };

  const handleOpenRejectProduct = (id: string) => {
    setProductRejectionReason('');
    setRejectProductDialogOpen(true);
  };

  const handleConfirmRejectProduct = () => {
    if (selectedProduct) {
      handleProductStatus(selectedProduct.id, 'rejected', productRejectionReason);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
        <StatsCard title="Total Products" value={stats?.totalProducts || 0} icon={Package} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Pending Moderation" value={pendingVendors.length + pendingProducts.length} icon={ShieldAlert} iconClassName="bg-destructive/10 text-destructive" />
        <StatsCard title="RFQ Moderation" value={stats?.activeRfqs || 0} icon={MessageCircle} iconClassName="bg-amber-500/10 text-amber-500" />
      </div>

      {/* <div className="grid lg:grid-cols-1">
        <SalesChart title="Platform GMV & Traffic" />
      </div> */}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Vendors */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Pending Vendor Approvals
              {pendingVendors.length > 0 && <Badge variant="destructive">{pendingVendors.length}</Badge>}
            </CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/vendors">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No pending vendor requests</p>
              ) : (
                pendingVendors.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{v.business_name || v.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">{v.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedVendor(v);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleVendorStatus(v.id, 'rejected')} disabled={actioningVendorId === v.id}><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => handleVendorStatus(v.id, 'approved')} disabled={actioningVendorId === v.id}><CheckCircle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <VendorDetailsDialog 
          vendor={selectedVendor} 
          open={detailsOpen} 
          onOpenChange={setDetailsOpen}
          onApprove={(id) => handleVendorStatus(id, 'approved')}
          onReject={(id, reason) => handleVendorStatus(id, 'rejected', reason)}
        />

        {/* Pending Products */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Products for Moderation
              {pendingProducts.length > 0 && <Badge variant="destructive">{pendingProducts.length}</Badge>}
            </CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/products">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No products awaiting review</p>
              ) : (
                pendingProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'; }} />
                      <div>
                        <p className="font-medium truncate max-w-[150px]">{p.name}</p>
                        <p className="text-sm text-muted-foreground">MOQ: {p.moq}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={actioningProductId === p.id} onClick={() => handleOpenRejectProduct(p.id)}><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" disabled={actioningProductId === p.id} onClick={() => handleProductStatus(p.id, 'approved')}>
                        {actioningProductId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Recent RFQ Inquiries
              {recentRfqs.length > 0 && <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{recentRfqs.length}</Badge>}
            </CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/rfqs">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRfqs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent RFQs</p>
              ) : (
                recentRfqs.map(rfq => (
                  <div key={rfq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[150px]">{rfq.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {rfq.quantity} • {rfq.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {rfq.moderation_status === 'pending_moderation' ? (
                        <Button size="sm" className="bg-primary text-white font-black text-[9px] uppercase tracking-widest h-8 px-3 rounded-lg shadow-md shadow-primary/10" asChild>
                          <Link to="/admin/rfqs">
                            Forward
                            <ArrowRight className="h-3 w-3 ml-1.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="font-bold text-[9px] uppercase tracking-widest h-8 px-3 rounded-lg" asChild>
                          <Link to="/admin/rfqs">
                            Manage
                            <ArrowRight className="h-3 w-3 ml-1.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Marketplace Orders
              {recentOrders.length > 0 && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">{recentOrders.length}</Badge>}
            </CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/orders">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent orders</p>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">ORD-{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{formatPrice(order.target_price * order.quantity)} • {order.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {order.moderation_status === 'pending_moderation' ? (
                        <Button size="sm" className="bg-primary text-white font-black text-[9px] uppercase tracking-widest h-8 px-3 rounded-lg shadow-md shadow-primary/10" asChild>
                          <Link to={`/admin/orders/${order.id}`}>
                            Forward
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/80" asChild>
                          <Link to={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Product Preview */}
      <ProductPreviewDialog
        product={selectedProduct}
        open={productPreviewOpen}
        onOpenChange={setProductPreviewOpen}
        categories={categories}
        mode="admin"
        onApprove={(id) => handleProductStatus(id, 'approved')}
        onReject={(id) => handleOpenRejectProduct(id)}
      />

      {/* Product Rejection Dialog */}
      <Dialog open={rejectProductDialogOpen} onOpenChange={setRejectProductDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Reject Product Listing</DialogTitle>
            <DialogDescription className="font-bold text-slate-500">Provide feedback to the seller about why this listing was rejected.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea 
              placeholder="e.g., Image quality is low, Price is unrealistic..." 
              value={productRejectionReason}
              onChange={(e) => setProductRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setRejectProductDialogOpen(false)} className="rounded-xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmRejectProduct} disabled={!productRejectionReason.trim()} className="rounded-xl px-8 font-black uppercase text-xs tracking-widest shadow-lg shadow-destructive/20">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
