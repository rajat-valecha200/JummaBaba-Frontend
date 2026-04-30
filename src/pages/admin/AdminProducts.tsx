import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter, Loader2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';
import { ProductPreviewDialog } from '@/components/admin/ProductPreviewDialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProductStatus = 'pending' | 'approved' | 'rejected';

interface ProductWithStatus {
  id: string;
  name: string;
  image: string;
  category: string;
  supplierId: string;
  supplierName: string;
  minPrice: number;
  moq: number;
  status: ProductStatus;
  submittedAt: string;
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProductList(data.map((p: any) => ({
        ...p,
        supplierName: p.supplier_name || 'System Vendor',
        categoryId: p.category_id,
        category: p.category_id || p.category,
        image: p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        submittedAt: p.created_at,
        minPrice: p.pricing_slabs?.[0]?.pricePerUnit || p.minPrice || 0,
        pricingSlabs: typeof p.pricing_slabs === 'string' ? JSON.parse(p.pricing_slabs) : p.pricing_slabs || [],
        description: p.description,
        shortDescription: p.short_description
      })));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = productList.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async (productId: string) => {
    try {
      await api.products.updateStatus(productId, 'approved');
      setProductList(productList.map(p => p.id === productId ? { ...p, status: 'approved' as ProductStatus } : p));
      toast({ title: 'Product Approved' });
    } catch (error: any) {
      toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
    }
    setDetailsOpen(false);
  };

  const handleOpenReject = (productId: string) => {
    setRejectingId(productId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      await api.products.updateStatus(rejectingId, 'rejected', rejectionReason);
      setProductList(productList.map(p => p.id === rejectingId ? { ...p, status: 'rejected' as ProductStatus, rejectionReason: rejectionReason } : p));
      toast({ title: 'Product Rejected' });
      setRejectDialogOpen(false);
      setRejectingId(null);
      setDetailsOpen(false);
    } catch (error: any) {
      toast({ title: 'Rejection Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleRevoke = async (productId: string) => {
    try {
      await api.products.updateStatus(productId, 'pending', '');
      setProductList(productList.map(p => p.id === productId ? { ...p, status: 'pending' as ProductStatus, rejectionReason: '' } : p));
      toast({ title: 'Rejection Revoked', description: 'Product is now pending review again.' });
    } catch (error: any) {
      toast({ title: 'Failed to revoke', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: ProductStatus, reason?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return (
          <div className="flex flex-col gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="cursor-help w-fit">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-bold mb-1">Rejection Reason:</p>
                <p className="text-sm font-medium">{reason}</p>
              </TooltipContent>
            </Tooltip>
            {reason && (
              <p className="text-[10px] font-bold text-destructive/70 italic max-w-[150px] leading-tight pl-1 border-l-2 border-destructive/20">
                {reason}
              </p>
            )}
          </div>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingCount = productList.filter(p => p.status === 'pending').length;

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
        <h1 className="text-2xl font-bold">Product Moderation</h1>
        <p className="text-muted-foreground">Review and approve product listings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{productList.filter(p => p.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">Approved Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{productList.filter(p => p.status === 'rejected').length}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              All Products
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.supplierName}</TableCell>
                  <TableCell>{formatPrice(product.minPrice)}</TableCell>
                  <TableCell>{product.moq} units</TableCell>
                  <TableCell>{getStatusBadge(product.status, product.rejection_reason)}</TableCell>
                  <TableCell>{new Date(product.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedProduct(product);
                          // We use detailsOpen for the preview now
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {product.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleOpenReject(product.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleApprove(product.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {product.status === 'rejected' && (
                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700" onClick={() => handleRevoke(product.id)} title="Revoke Rejection">
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <ProductPreviewDialog
        product={selectedProduct}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        categories={categories}
        mode="admin"
        onApprove={handleApprove}
        onReject={handleOpenReject}
      />

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Reject Listing</DialogTitle>
            <DialogDescription className="font-bold text-slate-500">Provide feedback to the seller about why this listing was rejected.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea 
              placeholder="e.g., Please provide higher resolution images. The wholesale price tiers seem inconsistent with the market rate." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="rounded-xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={!rejectionReason.trim()} className="rounded-xl px-8 font-black uppercase text-xs tracking-widest shadow-lg shadow-destructive/20">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
