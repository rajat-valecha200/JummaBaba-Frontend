import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
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
  Package,
  Settings,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { formatPrice, cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RfqTimeline, getRfqSteps } from '@/components/b2b/RfqTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function CatalogSlabDialogBanner({ rfq }: { rfq?: any }) {
  const [slabInfo, setSlabInfo] = useState<{ price: number; range?: string } | null>(null);

  useEffect(() => {
    if (!rfq) return;
    let isMounted = true;
    const fetchSlab = async () => {
      try {
        const products = await api.products.list();
        const found = products.find((p: any) => 
          (rfq.product_id && String(p.id) === String(rfq.product_id)) ||
          (rfq.product_name && p.name && p.name.toLowerCase().trim() === rfq.product_name.toLowerCase().trim())
        );

        if (found && isMounted) {
          const slabs = typeof found.pricing_slabs === 'string' 
            ? JSON.parse(found.pricing_slabs) 
            : (found.pricing_slabs || found.pricingSlabs || []);
          
          if (Array.isArray(slabs) && slabs.length > 0) {
            const qNum = Number(rfq.quantity) || 0;
            const match = slabs.find((s: any) => {
              const min = s.minQty;
              const max = s.maxQty;
              if (max === null || max === undefined) return qNum >= min;
              return qNum >= min && qNum <= max;
            }) || slabs[0];

            if (match && isMounted) {
              setSlabInfo({
                price: Number(match.pricePerUnit),
                range: `${match.minQty}${match.maxQty ? `-${match.maxQty}` : '+'} units`
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to lookup catalog slab for dialog:', err);
      }
    };

    fetchSlab();
    return () => { isMounted = false; };
  }, [rfq]);

  if (!rfq) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5 shadow-sm">
      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Catalog Slab Rate {slabInfo?.range ? `(${slabInfo.range})` : ''}:
        </span>
        <span className="font-mono text-sm text-amber-700 dark:text-amber-300 font-extrabold">
          {slabInfo ? `₹${slabInfo.price.toLocaleString()}` : 'Loading slab rate...'}
        </span>
      </div>
      {rfq.target_price && (
        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-500/15 text-muted-foreground">
          <span>Buyer's Original Target Price:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{Number(rfq.target_price).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

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
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  // Synchronous guards — a fast double-tap can fire a handler twice before React re-renders
  // with the button disabled, since the setState calls below only take effect next render.
  const forwardGuard = useRef(false);
  const quoteActionGuard = useRef(false);
  const privacyGuard = useRef(false);
  const cancellationGuard = useRef(false);
  const stepActionGuard = useRef(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelFee, setCancelFee] = useState('');
  const [cancelLiableParty, setCancelLiableParty] = useState<'buyer' | 'seller' | 'none'>('none');
  const [cancelAdminNotes, setCancelAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Custom Quote Modification Dialog States
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyQty, setModifyQty] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [isModifyingTerms, setIsModifyingTerms] = useState(false);

  const fetchRfqs = async () => {
    try {
      const data = await api.rfqs.list();
      const normalizedData = data.map((r: any) => {
        let details = typeof r.response_details === 'string' 
          ? JSON.parse(r.response_details) 
          : r.response_details || {};
        
        // Un-nest if double wrapped
        if (details.response_details && typeof details.response_details === 'object') {
          details = { ...details, ...details.response_details };
        }

        return {
          ...r,
          response_details: details
        };
      });
      setRfqs(normalizedData);
      if (selectedRfq) {
        const updated = normalizedData.find((r: any) => r.id === selectedRfq.id);
        if (updated) setSelectedRfq(updated);
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
      toast({ title: 'Error', description: 'Failed to load RFQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const [products, setProducts] = useState<any[]>([]);

  const getCatalogSlabForRfq = (rfq: any) => {
    if (!rfq) return null;
    const product = products.find((p: any) => 
      (rfq.product_id && String(p.id) === String(rfq.product_id)) || 
      (rfq.product_name && p.name && p.name.toLowerCase().trim() === rfq.product_name.toLowerCase().trim())
    );
    if (!product) return null;

    const slabs = typeof product.pricing_slabs === 'string' 
      ? JSON.parse(product.pricing_slabs) 
      : (product.pricing_slabs || product.pricingSlabs || []);
      
    if (!Array.isArray(slabs) || slabs.length === 0) return null;

    const qNum = Number(rfq.quantity) || 0;
    const match = slabs.find((s: any) => {
      const min = s.minQty;
      const max = s.maxQty;
      if (max === null || max === undefined) return qNum >= min;
      return qNum >= min && qNum <= max;
    }) || slabs[0];

    if (!match) return null;
    return {
      price: Number(match.pricePerUnit),
      range: `${match.minQty}${match.maxQty ? `-${match.maxQty}` : '+'} units`
    };
  };

  useEffect(() => {
    fetchRfqs();
    const interval = setInterval(() => fetchRfqs(true), 15000); // 15s live refresh
    
    const fetchVendors = async () => {
      try {
        const data = await api.profiles.list('vendor', 'approved');
        setVendors(data);
      } catch (err) {
        console.error('Failed to fetch vendors');
      }
    };
    fetchVendors();

    api.products.list().then(setProducts).catch(err => console.error('Failed to fetch products:', err));

    return () => clearInterval(interval);
  }, []);

  const handleForward = async (rfq: any) => {
    if (!rfq.supplier_id && !selectedVendorId) {
      setSelectedRfq(rfq);
      setForwardDialogOpen(true);
      return;
    }
    if (forwardGuard.current) return;
    forwardGuard.current = true;

    try {
      setIsForwarding(true);
      await api.rfqs.forward(rfq.id, selectedVendorId || rfq.supplier_id);
      toast({ title: 'Success', description: 'RFQ forwarded to seller' });
      setForwardDialogOpen(false);
      setSelectedVendorId('');
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      forwardGuard.current = false;
      setIsForwarding(false);
    }
  };

  const handleQuoteAction = async (id: string, status: 'approved' | 'rejected') => {
    if (quoteActionGuard.current) return;
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a rejection reason', variant: 'destructive' });
      return;
    }
    quoteActionGuard.current = true;
    try {
      setIsModerating(true);
      await api.rfqs.approveQuote(id, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : undefined
      });
      toast({ title: 'Success', description: `Quote ${status}` });
      setDetailsOpen(false);
      setRejectDialogOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      quoteActionGuard.current = false;
      setIsModerating(false);
    }
  };

  const handleTogglePrivacy = async (id: string, checked: boolean) => {
    if (privacyGuard.current) return;
    privacyGuard.current = true;
    setUpdatingPrivacy(true);
    try {
      await api.rfqs.togglePrivacy(id, checked);
      toast({ title: 'Privacy Updated', description: checked ? 'Contact details now visible to seller' : 'Contact details hidden from seller' });
      fetchRfqs();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      privacyGuard.current = false;
      setUpdatingPrivacy(false);
    }
  };

  const handleCancellationAction = async (id: string, status: 'approved' | 'rejected') => {
    if (cancellationGuard.current) return;
    cancellationGuard.current = true;
    try {
      setIsCancelling(true);
      await api.rfqs.updateCancellation(id, status);
      toast({ title: 'Success', description: `Cancellation ${status}` });
      setDetailsOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      cancellationGuard.current = false;
      setIsCancelling(false);
    }
  };

  // Shared handler for the ad-hoc negotiation-step actions below (forward finalized terms,
  // approve seller counter, send payment request, confirm payment received) — these previously
  // had no guard at all against a double-tap firing the request twice.
  const handleNegotiationStepAction = async (path: string, successTitle: string, successDesc: string, body?: any) => {
    if (stepActionGuard.current) return;
    stepActionGuard.current = true;
    setIsSubmittingStep(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${selectedRfq.id}/${path}`, {
        method: 'POST',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (res.ok) {
        toast({ title: successTitle, description: successDesc });
        setDetailsOpen(false);
        fetchRfqs();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: err.error || 'Action failed', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      stepActionGuard.current = false;
      setIsSubmittingStep(false);
    }
  };

  const openCancelDialog = () => {
    setCancelFee('');
    setCancelLiableParty('none');
    setCancelAdminNotes('');
    setShowCancelDialog(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedRfq || cancellationGuard.current) return;
    cancellationGuard.current = true;
    try {
      setIsCancelling(true);
      await api.rfqs.updateCancellation(selectedRfq.id, 'approved', {
        fee: Number(cancelFee) || 0,
        liable_party: cancelLiableParty,
        admin_notes: cancelAdminNotes.trim()
      });
      toast({ title: 'Order Cancelled', description: 'The order has been cancelled and the relevant party notified.' });
      setShowCancelDialog(false);
      setDetailsOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      cancellationGuard.current = false;
      setIsCancelling(false);
    }
  };

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'pending_moderation':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">New Inquiry</Badge>;
      case 'forwarded':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">Sent to Seller</Badge>;
      case 'quote_pending':
        return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest animate-pulse">Quote Received</Badge>;
      case 'quote_approved':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">Audit Passed</Badge>;
      case 'quote_rejected':
        return <Badge variant="destructive" className="font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">{status}</Badge>;
    }
  };

  const filteredRfqs = rfqs.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.moderation_status === statusFilter;
    const isStandardInquiry = r.is_direct_order !== true; // Only show non-direct orders here
    const matchesSearch = 
      (r.product_name && r.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.buyer_name && r.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.id && r.id.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesStatus && matchesSearch && isStandardInquiry;
  });

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

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative z-10 border-b border-border/50 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product, buyer, or ID..." 
                className="pl-9 bg-white border-border/50 focus:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white border-border/50">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderation</SelectItem>
                  <SelectItem value="pending_moderation">New Inquiries</SelectItem>
                  <SelectItem value="forwarded">Sent to Seller</SelectItem>
                  <SelectItem value="quote_pending">Quote Received</SelectItem>
                  <SelectItem value="quote_approved">Audit Passed</SelectItem>
                  <SelectItem value="quote_rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-0">
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
                          src={rfq.product_images?.[0]} 
                          className="w-10 h-10 rounded object-cover"
                          alt={rfq.product_name}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'; }}
                        />
                        <span className="font-medium">{rfq.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rfq.buyer_name || 'Anonymous'}</TableCell>
                    <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Target: {rfq.target_price ? formatPrice(rfq.target_price) : 'N/A'}</div>
                        {rfq.response_details?.price && (
                          <div className="text-sm font-black text-primary">Quote: {formatPrice(rfq.response_details.price)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getModerationBadge(rfq.moderation_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedRfq(rfq); setDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {rfq.moderation_status === 'pending_moderation' && (
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 px-4" onClick={() => handleForward(rfq)} disabled={isForwarding}>
                            {isForwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Forward
                          </Button>
                        )}
                        {rfq.moderation_status === 'quote_pending' && (
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 px-4" onClick={() => { setSelectedRfq(rfq); setDetailsOpen(true); }}>
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
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] border-border/50 bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-[85vh] max-h-[750px]">
            <div className="w-72 border-r border-border/50 bg-slate-50/50 p-6 hidden lg:block overflow-y-auto shrink-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8">Moderation Lifecycle</h3>
              {selectedRfq && (
                <RfqTimeline steps={getRfqSteps(selectedRfq.status, selectedRfq.moderation_status)} />
              )}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <DialogHeader className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle className="text-xl sm:text-2xl font-black tracking-tighter">Inquiry Moderation</DialogTitle>
                  {selectedRfq && getModerationBadge(selectedRfq.moderation_status)}
                </div>
                <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                  Reference ID: {selectedRfq?.id}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6">
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-destructive text-destructive hover:bg-destructive/10" 
                            onClick={() => handleCancellationAction(selectedRfq.id, 'rejected')}
                            disabled={isCancelling}
                          >
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Reject Cancellation
                          </Button>
                          <Button
                            size="sm"
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={openCancelDialog}
                            disabled={isCancelling}
                          >
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Approve Cancellation
                          </Button>
                        </div>
                      </div>
                    )}
                    {!selectedRfq.cancellation_request?.status || selectedRfq.cancellation_request?.status === 'rejected' ? (
                      !['completed', 'cancelled', 'closed'].includes(selectedRfq.status) && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={openCancelDialog}
                          >
                            <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                          </Button>
                        </div>
                      )
                    ) : null}
                    <Tabs defaultValue="rfq" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="rfq">Buyer Request</TabsTrigger>
                        <TabsTrigger value="quote" disabled={!selectedRfq.response_details || Object.keys(selectedRfq.response_details).length === 0}>
                          Seller Quote
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="rfq" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                <User className="h-4 w-4 text-primary" /> Buyer Information
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="share_buyer_details" 
                                  checked={selectedRfq.share_buyer_details} 
                                  onCheckedChange={(checked) => handleTogglePrivacy(selectedRfq.id, !!checked)}
                                  disabled={updatingPrivacy}
                                />
                                <Label htmlFor="share_buyer_details" className="text-[10px] font-bold uppercase cursor-pointer">Share Details</Label>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="font-bold text-slate-900">{selectedRfq.buyer_name || 'Buyer User'}</p>
                              <p className="text-muted-foreground">{selectedRfq.buyer_email}</p>
                              <p className="text-muted-foreground font-mono">{selectedRfq.buyer_phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Package className="h-4 w-4 text-primary" /> Request Details
                            </div>
                            <div className="text-sm space-y-1.5">
                              <p className="font-bold text-slate-900 text-base">{selectedRfq.product_name || 'Industrial Product'}</p>
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                <span className="text-muted-foreground font-bold">Qty Required:</span>
                                <span className="font-black text-slate-900">{selectedRfq.quantity} {selectedRfq.unit}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-bold">Target Price:</span>
                                <span className="font-black text-primary">{selectedRfq.target_price ? formatPrice(selectedRfq.target_price) : 'N/A'}</span>
                              </div>
                              {(() => {
                                const slab = getCatalogSlabForRfq(selectedRfq);
                                if (!slab) return null;
                                return (
                                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                                    <span>Catalog Slab Rate ({slab.range}):</span>
                                    <span className="font-mono font-black">{formatPrice(slab.price)} / {selectedRfq.unit}</span>
                                  </div>
                                );
                              })()}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-bold">Delivery Site:</span>
                                <span className="font-bold text-slate-700">{selectedRfq.delivery_location || 'N/A'}</span>
                              </div>
                              {selectedRfq.supplier_name && (
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                  <span className="text-muted-foreground font-bold">Requested Supplier:</span>
                                  <span className="font-bold text-indigo-600 underline">{selectedRfq.supplier_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Description</p>
                            <ExpandableText
                              text={selectedRfq.description || 'No description provided'}
                              textClassName="text-sm"
                              lines={2}
                              charLimit={140}
                              title="Full RFQ Description"
                            />
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModifyPrice(String(selectedRfq.target_price || ''));
                              setModifyQty(String(selectedRfq.quantity || ''));
                              setShowModifyDialog(true);
                            }}
                            className="text-xs font-bold border-cyan-500/30 text-cyan-700 hover:bg-cyan-500/10 shrink-0"
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Adjust / Modify Terms
                          </Button>
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
                            <p className="text-sm font-bold text-slate-500">Seller's Quoted Price</p>
                            <p className="text-3xl font-black text-primary">
                              {selectedRfq.response_details?.price ? formatPrice(selectedRfq.response_details.price) : 'NOT QUOTED'}
                            </p>
                            <p className="text-xs font-bold text-slate-400">Buyer's Original Target: {formatPrice(selectedRfq.target_price)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-500">Estimated Lead Time</p>
                            <p className="text-xl font-black text-slate-900">{selectedRfq.response_details?.lead_time || 'Immediate'}</p>
                          </div>
                        </div>

                        {/* Direct detailed splits calculator rendering for Admin audit */}
                        {selectedRfq.response_details?.price && (
                          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                            <div className="flex justify-between font-bold text-slate-900 border-b pb-1">
                              <span>Admin Sourcing Audit splits</span>
                              <span>Rate / Value</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Product Price (Gross Base):</span>
                              <span className="font-semibold text-slate-800">{formatPrice(selectedRfq.response_details.price * selectedRfq.quantity)}</span>
                            </div>
                            <div className="flex justify-between text-indigo-600">
                              <span>Platform Service Fee Commission (10%):</span>
                              <span className="font-bold">-{formatPrice(selectedRfq.response_details.price * selectedRfq.quantity * 0.10)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>Vendor Payout Settlement:</span>
                              <span>{formatPrice(selectedRfq.response_details.price * selectedRfq.quantity * 0.90)}</span>
                            </div>
                          </div>
                        )}
                          
                          {selectedRfq.response_details?.notes && (
                            <div className="pt-2">
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Seller Notes</p>
                              <p className="text-sm bg-background/50 p-3 rounded border italic">
                                "{selectedRfq.response_details.notes}"
                              </p>
                            </div>
                          )}

                          {/* Sourcing adjustment control triggers in details drawer */}
                          <div className="pt-4 border-t border-slate-100 flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setModifyPrice(String(selectedRfq.response_details?.price || selectedRfq.target_price || ''));
                                setModifyQty(String(selectedRfq.quantity || ''));
                                setShowModifyDialog(true);
                              }}
                              className="text-xs w-full font-bold"
                            >
                              Modify Quote Terms
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>

              <DialogFooter className="p-8 border-t border-white/5 flex-col sm:flex-col items-stretch sm:justify-start sm:space-x-0 gap-3">
                <div className="flex flex-wrap gap-2 w-full">
                  {selectedRfq?.moderation_status === 'pending_moderation' && (
                    <Button onClick={() => handleForward(selectedRfq)} disabled={isForwarding}>
                      {isForwarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Forward to Seller
                    </Button>
                  )}
                  {selectedRfq?.moderation_status === 'quote_pending' && (
                    <>
                      <Button variant="outline" className="text-destructive" onClick={() => setRejectDialogOpen(true)} disabled={isModerating}>
                        <XCircle className="h-4 w-4 mr-2" /> Reject Quote
                      </Button>
                      <Button className="bg-success hover:bg-success/90" onClick={() => handleQuoteAction(selectedRfq.id, 'approved')} disabled={isModerating}>
                        {isModerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve Quote
                      </Button>
                    </>
                  )}
                  {selectedRfq && (selectedRfq.negotiation_step === 'buyer_confirmed_admin' || selectedRfq.negotiation_step === 'buyer_confirmed_seller_counter') && (
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      disabled={isSubmittingStep}
                      onClick={() => handleNegotiationStepAction('forward-to-seller', 'Success', 'RFQ finalized terms forwarded to seller.')}
                    >
                      {isSubmittingStep ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Forward Finalized Terms to Seller
                    </Button>
                  )}
                  {selectedRfq && selectedRfq.negotiation_step === 'seller_countered' && (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      disabled={isSubmittingStep}
                      onClick={() => handleNegotiationStepAction('admin-approve-counter', 'Approved', 'Seller counter approved.')}
                    >
                      {isSubmittingStep ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Approve Seller Counter
                    </Button>
                  )}
                  {selectedRfq && selectedRfq.negotiation_step === 'seller_accepted_terms' && (
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                      disabled={isSubmittingStep}
                      onClick={() => {
                        // Prompt for coupon percentage
                        const pct = prompt('Enter Discount Coupon Percentage (Optional, e.g. 10):', '0');
                        if (pct === null) return;
                        handleNegotiationStepAction('payment-request', 'Payment Request Sent', 'Statement successfully generated and buyer notified.', { discountPercentage: Number(pct) || 0 });
                      }}
                    >
                      {isSubmittingStep ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Send Payment Request & Coupon
                    </Button>
                  )}
                  {selectedRfq && selectedRfq.negotiation_step === 'payment_submitted' && (
                    <Button
                      className="bg-success hover:bg-success/90 text-white font-bold"
                      disabled={isSubmittingStep}
                      onClick={() => handleNegotiationStepAction('admin-confirm-payment', 'Payment Confirmed', 'Payment verified and PO generated.')}
                    >
                      {isSubmittingStep ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Confirm Payment Received
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {selectedRfq && (
                    <Link to={`/admin/rfqs/${selectedRfq.id}`}>
                      <Button variant="outline" className="font-bold gap-2 text-xs py-2 rounded-xl">
                        <FileText className="h-4 w-4" /> Full Audit Trail
                      </Button>
                    </Link>
                  )}
                  {selectedRfq && (
                    <Link to={`/admin/messages?chatGroupId=${selectedRfq.order_group_id || selectedRfq.negotiation_group_id || ''}&rfqId=${selectedRfq.id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs py-2 rounded-xl">
                        <MessageSquare className="h-4 w-4" /> Go to Chat Room
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={() => setDetailsOpen(false)}>Close</Button>
                </div>
              </DialogFooter>
            </div>
          </div>
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
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isModerating}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleQuoteAction(selectedRfq?.id, 'rejected')} disabled={!rejectionReason.trim() || isModerating}>
              {isModerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)} disabled={isForwarding}>Cancel</Button>
            <Button onClick={() => selectedRfq && handleForward(selectedRfq)} disabled={!selectedVendorId || isForwarding}>
              {isForwarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Sourcing Term Adjustment Dialog Popup */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Sourcing Proposal Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <CatalogSlabDialogBanner rfq={selectedRfq} />
            <div className="space-y-2">
              <label className="font-semibold text-xs">Adjusted Unit Sourcing Price (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={modifyPrice}
                onChange={(e) => setModifyPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-xs">Adjusted Sourcing Volume *</label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={modifyQty}
                onChange={(e) => setModifyQty(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                Modification Reason / Remark *
              </label>
              <Textarea
                placeholder="Explain why terms were adjusted (e.g. Volume discount applied, special delivery surcharge, tier pricing adjustment)..."
                value={modifyNotes}
                onChange={(e) => setModifyNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            {modifyPrice && modifyQty && (
              <div className="p-3 bg-muted rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p className="font-bold border-b pb-1 text-slate-800">Financial Splits Calculation</p>
                <div className="flex justify-between">
                  <span>Product Base Value:</span>
                  <span className="font-bold">₹{(Number(modifyPrice) * Number(modifyQty)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Platform Fee Commission (10%):</span>
                  <span className="font-bold">- ₹{(Number(modifyPrice) * Number(modifyQty) * 0.10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Expected Vendor Settlement (90%):</span>
                  <span>₹{(Number(modifyPrice) * Number(modifyQty) * 0.90).toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                if (selectedRfq && modifyPrice && modifyQty && modifyNotes.trim()) {
                  setIsModifyingTerms(true);
                  try {
                    await api.rfqs.adminModify(selectedRfq.id, Number(modifyPrice), Number(modifyQty), modifyNotes.trim());
                    toast({ title: 'Terms Adjusted', description: 'Proposed spec terms sent to Buyer.' });
                    setShowModifyDialog(false);
                    setDetailsOpen(false);
                    setModifyNotes('');
                    fetchRfqs();
                  } catch (err: any) {
                    toast({ title: 'Failed to adjust terms', description: err.message, variant: 'destructive' });
                  } finally {
                    setIsModifyingTerms(false);
                  }
                }
              }}
              disabled={isModifyingTerms || !modifyPrice || !modifyQty || !modifyNotes.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              {isModifyingTerms ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm & Apply Terms Adjustment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Cancellation Dialog: manual fee + liable-party selection */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Set a cancellation fee (if any) and choose which party is charged. The buyer's or seller's settlement will reflect this deduction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <div className="space-y-2">
              <label className="font-semibold text-xs">Cancellation Fee (₹)</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={cancelFee}
                onChange={(e) => setCancelFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-xs">Charged To</label>
              <Select value={cancelLiableParty} onValueChange={(v) => setCancelLiableParty(v as 'buyer' | 'seller' | 'none')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Charge</SelectItem>
                  <SelectItem value="buyer">Buyer (deducted from refund)</SelectItem>
                  <SelectItem value="seller">Seller (debited from ledger balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-xs">Notes</label>
              <Textarea
                placeholder="Reason for cancellation / fee basis..."
                value={cancelAdminNotes}
                onChange={(e) => setCancelAdminNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Back
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleConfirmCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
