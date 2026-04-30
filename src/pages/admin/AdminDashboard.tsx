import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Users, Package, Building, TrendingUp, CheckCircle, XCircle, Clock, Loader2, Eye } from 'lucide-react';
import { VendorDetailsDialog } from '@/components/admin/VendorDetailsDialog';
import { normalizeProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
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
      const [statsData, vendorsData, productsData] = await Promise.all([
        api.stats.get('admin'),
        api.profiles.list('vendor', 'pending'),
        api.products.list('pending')
      ]);
      setStats(statsData);
      setPendingVendors(vendorsData.map((v: any) => normalizeProfile(v)));
      setPendingProducts(productsData.map((p: any) => ({
        ...p,
        categoryId: p.category_id,
        pricingSlabs: typeof p.pricing_slabs === 'string' ? JSON.parse(p.pricing_slabs) : p.pricing_slabs || [],
      })));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVendorStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
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
    }
    setDetailsOpen(false);
  };

  const handleProductStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.products.updateStatus(id, status, reason);
      toast({ title: `Product ${status === 'approved' ? 'Approved' : 'Rejected'}` });
      setProductPreviewOpen(false);
      setRejectProductDialogOpen(false);
      fetchData(); // Refresh all data
    } catch (error: any) {
      toast({ title: 'Operation Failed', description: error.message, variant: 'destructive' });
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
        <StatsCard title="Total Users" value={stats?.users || 0} icon={Users} />
        <StatsCard title="Verified Vendors" value={stats?.vendors || 0} icon={Building} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Products Listed" value={stats?.products || 0} icon={Package} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Pending Items" value={(stats?.pendingVendors || 0) + (stats?.pendingProducts || 0)} icon={Clock} iconClassName="bg-warning/10 text-warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
                      <Button size="sm" variant="outline" onClick={() => handleVendorStatus(v.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => handleVendorStatus(v.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
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
                      <Button size="sm" variant="outline" onClick={() => handleOpenRejectProduct(p.id)}><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => handleProductStatus(p.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
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
