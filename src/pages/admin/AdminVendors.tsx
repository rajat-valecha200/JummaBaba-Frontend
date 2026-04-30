import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter, Star, Loader2, FileText, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { VendorDetailsDialog } from '@/components/admin/VendorDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { api, apiFetch, normalizeProfile } from '@/lib/api';
import { TrustBadge } from '@/components/b2b/TrustBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VendorStatus = 'pending' | 'approved' | 'rejected';

export default function AdminVendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewTitle, setImagePreviewTitle] = useState('');

  const fetchVendors = async () => {
    try {
      const data = await api.profiles.list('vendor');
      setVendors(data.map((v: any) => normalizeProfile({
        ...v,
        location: v.location || 'Not Specified',
        gstNumber: v.gst_number || 'N/A',
        establishedYear: v.established_year || 'N/A',
        totalProducts: v.total_products || 0,
        submittedAt: v.created_at,
        panNumber: v.pan_number || 'N/A',
        businessType: v.business_type || 'N/A'
      })));
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesSearch = v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleVendorStatus = async (vendorId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      let updated;
      if (reason === 'reset') {
        updated = await api.profiles.updateStatus(vendorId, 'pending');
        toast({ title: 'Vendor Reset to Pending' });
      } else {
        updated = await api.profiles.updateStatus(vendorId, status, reason);
        toast({ title: `Vendor ${status === 'approved' ? 'Approved' : 'Rejected'}` });
      }
      
      // Update selected vendor state to reflect changes in the details sheet immediately
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor({ ...selectedVendor, status: updated.status, rejection_reason: updated.rejection_reason });
      }
      
      fetchVendors();
    } catch (error: any) {
      toast({ title: 'Operation Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleApprove = async (vendorId: string) => {
    await handleVendorStatus(vendorId, 'approved');
  };

  const handleOpenReject = (vendorId: string) => {
    setRejectingId(vendorId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    await handleVendorStatus(rejectingId, 'rejected', rejectionReason);
    setRejectDialogOpen(false);
    setRejectingId(null);
  };

  const handleToggleTop = async (vendorId: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/profiles/${vendorId}/top-supplier`, {
        method: 'PATCH',
        body: JSON.stringify({ is_top_supplier: !currentStatus })
      });
      toast({ 
        title: !currentStatus ? 'Supplier Featured' : 'Removed from Featured',
        description: !currentStatus ? 'They will now appear in the Top Suppliers section.' : 'They have been removed from the homepage slider.' 
      });
      fetchVendors();
    } catch (error: any) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: VendorStatus, reason?: string) => {
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

  const pendingCount = vendors.filter(v => v.status === 'pending').length;

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
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        <p className="text-muted-foreground">Review and approve vendor applications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{vendors.filter(v => v.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">Approved Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{vendors.filter(v => v.status === 'rejected').length}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              All Vendors
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
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
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Est. Year</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={vendor.logo} alt={vendor.companyName} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium">{vendor.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.location}</TableCell>
                  <TableCell className="font-mono text-sm">{vendor.gstNumber}</TableCell>
                  <TableCell>{vendor.establishedYear}</TableCell>
                  <TableCell>{vendor.totalProducts}</TableCell>
                  <TableCell>{getStatusBadge(vendor.status, vendor.rejectionReason)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleTop(vendor.id, vendor.is_top_supplier || false)}
                      className={vendor.is_top_supplier ? "text-b2b-orange" : "text-muted-foreground/30"}
                    >
                      <Star className={cn("h-4 w-4", vendor.is_top_supplier && "fill-current")} />
                    </Button>
                  </TableCell>
                  <TableCell>{new Date(vendor.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {vendor.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleOpenReject(vendor.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleApprove(vendor.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {vendor.status === 'rejected' && (
                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700" onClick={() => handleVendorStatus(vendor.id, 'rejected', 'reset')}>
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vendors found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <VendorDetailsDialog 
        vendor={selectedVendor}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onApprove={(id) => handleApprove(id)}
        onReject={(id, reason) => {
          if (reason === 'reset') {
            handleVendorStatus(id, 'rejected', 'reset');
          } else {
            handleOpenReject(id);
          }
        }}
      />
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this vendor.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g., Documents are unclear, Business type not supported..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Document Preview Modal */}
      <Dialog open={!!imagePreviewUrl} onOpenChange={(open) => !open && setImagePreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-background">
            <DialogTitle>{imagePreviewTitle}</DialogTitle>
            <DialogDescription className="sr-only">Viewing document: {imagePreviewTitle}</DialogDescription>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center min-h-[400px] bg-muted/20">
            {imagePreviewUrl && (
              imagePreviewUrl.endsWith('.pdf') ? (
                <iframe 
                  src={imagePreviewUrl} 
                  className="w-full h-[70vh] border-0"
                  title="PDF Preview"
                />
              ) : (
                <img 
                  src={imagePreviewUrl} 
                  alt={imagePreviewTitle} 
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" 
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
