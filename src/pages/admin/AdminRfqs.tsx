import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  Eye,
  Loader2,
  FileText,
  User,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminRfqs() {
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  const fetchRfqs = async () => {
    try {
      const data = await api.rfqs.list();
      setRfqs(data);
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
      toast({ title: 'Error', description: 'Failed to load RFQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
    const fetchVendors = async () => {
      try {
        const data = await api.profiles.list('vendor', 'approved');
        setVendors(data);
      } catch (err) {
        console.error('Failed to fetch vendors');
      }
    };
    fetchVendors();
  }, []);

  const handleForward = async (rfq: any) => {
    if (!rfq.supplier_id && !selectedVendorId) {
      setSelectedRfq(rfq);
      setForwardDialogOpen(true);
      return;
    }

    try {
      await api.rfqs.forward(rfq.id, selectedVendorId || rfq.supplier_id);
      toast({ title: 'Success', description: 'RFQ forwarded to seller' });
      setForwardDialogOpen(false);
      setSelectedVendorId('');
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleQuoteAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'rejected' && !rejectionReason.trim()) {
        toast({ title: 'Error', description: 'Please provide a rejection reason', variant: 'destructive' });
        return;
      }

      await api.rfqs.updateQuoteStatus(id, status, status === 'rejected' ? rejectionReason : undefined);
      toast({ title: 'Success', description: `Quote ${status}` });
      setDetailsOpen(false);
      setRejectDialogOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancellationAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.rfqs.updateCancellation(id, status);
      toast({ title: 'Success', description: `Cancellation ${status}` });
      setDetailsOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'pending_moderation':
        return <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">New RFQ</Badge>;
      case 'forwarded':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 hover:bg-blue-500/30">With Seller</Badge>;
      case 'quote_pending':
        return <Badge className="bg-accent/20 text-accent border-accent/30 animate-pulse">Quote Received</Badge>;
      case 'quote_approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'quote_rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRfqs = rfqs.filter(rfq => 
    rfq.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfq.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfq.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">RFQ Moderation</h1>
          <p className="text-muted-foreground">Monitor and approve the buyer-seller negotiation flow</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product or buyer name..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRfqs.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={rfq.product_images?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} 
                          className="w-10 h-10 rounded object-cover"
                          alt={rfq.product_name}
                        />
                        <span className="font-medium">{rfq.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rfq.buyer_name}</TableCell>
                    <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                    <TableCell>{formatPrice(rfq.target_price)}</TableCell>
                    <TableCell>{getModerationBadge(rfq.moderation_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedRfq(rfq); setDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {rfq.moderation_status === 'pending_moderation' && (
                          <Button size="sm" onClick={() => handleForward(rfq)}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Forward
                          </Button>
                        )}
                        {rfq.moderation_status === 'quote_pending' && (
                          <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={() => { setSelectedRfq(rfq); setDetailsOpen(true); }}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Review Quote
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>RFQ & Quote Details</DialogTitle>
            <DialogDescription>Review and manage the request workflow</DialogDescription>
          </DialogHeader>
          
          {selectedRfq && (
            <div className="space-y-6">
              {selectedRfq.cancellation_request?.status === 'pending' && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-bold">
                    <XCircle className="h-5 w-5" /> Cancellation Request Received
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Reason:</span> {selectedRfq.cancellation_request.reason}</p>
                    <p><span className="font-semibold">Requested At:</span> {new Date(selectedRfq.cancellation_request.requested_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleCancellationAction(selectedRfq.id, 'rejected')}>
                      Reject Cancellation
                    </Button>
                    <Button size="sm" className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleCancellationAction(selectedRfq.id, 'approved')}>
                      Approve Cancellation
                    </Button>
                  </div>
                </div>
              )}
              <Tabs defaultValue="rfq" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rfq">Buyer Request</TabsTrigger>
                  <TabsTrigger value="quote" disabled={!selectedRfq.response_details || Object.keys(selectedRfq.response_details).length === 0}>
                    Seller Quote
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="rfq" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-4 w-4 text-primary" /> Buyer Information
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{selectedRfq.buyer_name}</p>
                        <p className="text-muted-foreground">{selectedRfq.buyer_email}</p>
                        <p className="text-muted-foreground">{selectedRfq.buyer_phone}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Package className="h-4 w-4 text-primary" /> Request Details
                      </div>
                      <div className="text-sm">
                        <p><span className="text-muted-foreground">Qty:</span> {selectedRfq.quantity} {selectedRfq.unit}</p>
                        <p><span className="text-muted-foreground">Target:</span> {formatPrice(selectedRfq.target_price)}</p>
                        <p><span className="text-muted-foreground">Loc:</span> {selectedRfq.delivery_location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selectedRfq.description || 'No description provided'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="quote" className="space-y-4 pt-4">
                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-accent font-bold">
                        <FileText className="h-5 w-5" /> Seller Submission
                      </div>
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        {selectedRfq.moderation_status === 'quote_pending' ? 'Awaiting Approval' : 'Reviewed'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Quoted Price</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(selectedRfq.response_details?.price)}</p>
                        <p className="text-xs text-muted-foreground">Buyer Target: {formatPrice(selectedRfq.target_price)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Lead Time</p>
                        <p className="text-xl font-semibold">{selectedRfq.response_details?.lead_time || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedRfq.response_details?.notes && (
                      <div className="pt-2">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Seller Notes</p>
                        <p className="text-sm bg-background/50 p-3 rounded border italic">
                          "{selectedRfq.response_details.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between gap-2">
            <div className="flex gap-2">
              {selectedRfq?.moderation_status === 'pending_moderation' && (
                <Button onClick={() => handleForward(selectedRfq)}>
                  Forward to Seller
                </Button>
              )}
              {selectedRfq?.moderation_status === 'quote_pending' && (
                <>
                  <Button variant="outline" className="text-destructive" onClick={() => setRejectDialogOpen(true)}>
                    <XCircle className="h-4 w-4 mr-2" /> Reject Quote
                  </Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => handleQuoteAction(selectedRfq.id, 'approved')}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve Quote
                  </Button>
                </>
              )}
            </div>
            <Button variant="ghost" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Seller Quote</DialogTitle>
            <DialogDescription>Provide a reason for the seller to revise their quote.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g., Price is too high compared to market average..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleQuoteAction(selectedRfq?.id, 'rejected')} disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward General RFQ</DialogTitle>
            <DialogDescription>
              Select a verified supplier to handle this general requirement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-bold">Requirement: {selectedRfq?.product_name}</p>
              <p className="text-muted-foreground line-clamp-2 mt-1">{selectedRfq?.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Supplier</label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.business_name || v.full_name}</SelectItem>
                  ))}
                  {vendors.length === 0 && <p className="p-2 text-xs text-muted-foreground">No verified suppliers available</p>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedRfq && handleForward(selectedRfq)} disabled={!selectedVendorId}>
              Confirm & Forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
