import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Filter, MessageSquare, Clock, CheckCircle, Send, Info, HelpCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import { api, apiFetch } from '@/lib/api';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RfqTimeline, getRfqSteps } from '@/components/b2b/RfqTimeline';
import { QuoteForm } from '@/components/b2b/QuoteForm';
import { motion, AnimatePresence } from 'framer-motion';

// Extended RFQ status flow
type RfqStatus = 'pending' | 'quoted' | 'admin_approved' | 'sent_to_buyer' | 'closed';

interface RfqResponse {
  price: number;
  deliveryDays: number;
  message: string;
  respondedAt: string;
}

interface Rfq {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice: number | null;
  deliveryLocation: string;
  description: string;
  status: RfqStatus;
  createdAt: string;
  response?: RfqResponse;
}

export default function VendorRfqs() {
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);

  // Vendor Counter Dialog States
  const [vendorCounterOpen, setVendorCounterOpen] = useState(false);
  const [vendorCounterPrice, setVendorCounterPrice] = useState('');
  const [vendorCounterQty, setVendorCounterQty] = useState('');
  const [isSubmittingVendorCounter, setIsSubmittingVendorCounter] = useState(false);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const data = await api.rfqs.list();
        const normalizedData = data.map((r: any) => {
          let details = typeof r.response_details === 'string' 
            ? JSON.parse(r.response_details) 
            : r.response_details || {};
          
          if (details.response_details && typeof details.response_details === 'object') {
            details = { ...details, ...details.response_details };
          }
          
          return {
            ...r,
            productName: r.product_name || r.productName,
            buyerName: r.buyer_name || r.buyerName || 'Client',
            buyerEmail: r.buyer_email || r.buyerEmail || 'client@jummababa.com',
            buyerPhone: r.buyer_phone || r.buyerPhone || 'N/A',
            deliveryLocation: r.delivery_location || r.deliveryLocation || 'N/A',
            description: r.description || '',
            createdAt: r.created_at,
            targetPrice: Number(r.target_price) || null,
            status: (r.vendor_status || r.status || 'pending') as RfqStatus,
            response: details.price ? {
              price: Number(details.price) || 0,
              lead_time: details.lead_time || 'N/A',
              notes: details.notes || details.message || '',
              respondedAt: details.respondedAt || r.created_at,
            } : undefined,
            response_details: details,
            moderationStatus: r.moderation_status,
            rejectionReason: r.quote_rejection_reason
          };
        });
        setRfqs(normalizedData);
      } catch (err) {
        console.error('RFQ fetch failed');
      } finally {
        setLoading(false);
      }
    };
    fetchRfqs();
  }, []);

  const filteredRfqs = rfqs.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch && !r.is_direct_order;
  });

  const handleOpenResponse = (rfq: Rfq) => {
    setSelectedRfq(rfq);
    setResponseOpen(true);
  };

  const handleSubmitResponse = async (details: any) => {
    if (!selectedRfq) return;
    setLoading(true);
    try {
      await api.rfqs.submitQuote(selectedRfq.id, {
        price: details.price_slabs[0].unit_price,
        price_slabs: details.price_slabs,
        lead_time: details.lead_time,
        notes: details.vendor_notes,
        respondedAt: new Date().toISOString(),
      });

      setRfqs(rfqs.map(r => 
        r.id === selectedRfq.id 
          ? {
              ...r,
              status: 'quoted' as RfqStatus,
              response: {
                price: details.price_slabs[0].unit_price,
                lead_time: details.lead_time,
                notes: details.vendor_notes,
                respondedAt: new Date().toISOString(),
              },
            }
          : r
      ));

      toast({ title: 'Quote submitted! Awaiting admin approval before being sent to buyer.' });
      setResponseOpen(false);
      setSelectedRfq(null);
    } catch (err: any) {
      toast({ title: 'Failed to submit quote', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (rfq: any) => {
    const status = rfq.status as RfqStatus;
    const moderationStatus = rfq.moderationStatus;
    
    switch (status) {
      case 'closed':
        return <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest">Closed</Badge>;
      case 'quoted':
        if (moderationStatus === 'quote_rejected') {
          return <Badge variant="destructive" className="font-bold uppercase text-[10px] tracking-widest animate-pulse">Revision Required</Badge>;
        }
        return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold uppercase text-[10px] tracking-widest"><Clock className="h-3 w-3 mr-1" />Awaiting Audit</Badge>;
      case 'admin_approved':
      case 'sent_to_buyer':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold uppercase text-[10px] tracking-widest"><CheckCircle className="h-3 w-3 mr-1" />Live Quote</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[10px] tracking-widest"><Clock className="h-3 w-3 mr-1" />New Lead</Badge>;
    }
  };

  const pendingCount = rfqs.filter(r => r.status === 'pending').length;
  const quotedCount = rfqs.filter(r => r.status === 'quoted').length;
  const approvedCount = rfqs.filter(r => r.status === 'admin_approved' || r.status === 'sent_to_buyer').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RFQ Management</h1>
        <p className="text-muted-foreground">Respond to buyer inquiries and send quotes</p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center gap-1">
          Your quotes will be shared with buyers after admin approval.
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              JummaBaba Support reviews all quotes before sending to buyers to ensure quality and fair pricing.
            </TooltipContent>
          </Tooltip>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-black">{rfqs.length}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <ArrowRight className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{pendingCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{quotedCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Audit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{approvedCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              Incoming RFQs
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} new</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
                <TableHead>Buyer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell>
                    <p className="font-medium truncate max-w-[180px]">{rfq.productName}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rfq.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{rfq.buyerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                  <TableCell>
                    {rfq.targetPrice ? formatPrice(rfq.targetPrice) : <span className="text-muted-foreground">Not specified</span>}
                  </TableCell>
                  <TableCell>{rfq.deliveryLocation}</TableCell>
                  <TableCell>{getStatusBadge(rfq)}</TableCell>
                  <TableCell>{new Date(rfq.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {rfq.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOpenResponse(rfq)}>
                          <Send className="h-4 w-4 mr-1" />
                          Quote
                        </Button>
                      )}
                      {rfq.moderationStatus === 'quote_rejected' && (
                        <Button size="sm" variant="destructive" onClick={() => handleOpenResponse(rfq)}>
                          <Send className="h-4 w-4 mr-1" />
                          Revise
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRfqs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No RFQs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFQ Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl border-border/50 bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="flex h-[80vh]">
            <div className="w-80 border-r border-border/50 bg-slate-50/50 p-8 hidden md:block">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8">Inquiry Progress</h3>
              {selectedRfq && (
                <RfqTimeline steps={getRfqSteps(selectedRfq.status, selectedRfq.status === 'quoted' ? 'quote_pending' : selectedRfq.status)} />
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <DialogHeader className="p-8 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle className="text-2xl font-black tracking-tighter">Requirement Details</DialogTitle>
                  {selectedRfq && getStatusBadge(selectedRfq)}
                </div>
                <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                  Reference ID: {selectedRfq?.id}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedRfq && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(selectedRfq)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedRfq.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Product Required</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{selectedRfq.productName}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Qty: <strong>{selectedRfq.quantity} {selectedRfq.unit}</strong></span>
                          {selectedRfq.targetPrice && (
                            <span>Target: <strong>{formatPrice(selectedRfq.targetPrice)}/{selectedRfq.unit}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        {selectedRfq.description}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Buyer Information</h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="font-medium">{selectedRfq.buyerName}</p>
                        <p className="text-sm text-muted-foreground">{selectedRfq.buyerEmail}</p>
                        <p className="text-sm text-muted-foreground">{selectedRfq.buyerPhone}</p>
                        <p className="text-sm text-muted-foreground">📍 {selectedRfq.deliveryLocation}</p>
                      </div>
                    </div>

                    {selectedRfq.response && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2 text-success">Your Response</h4>
                          <div className={cn(
                            "p-3 rounded-lg space-y-2",
                            selectedRfq.moderationStatus === 'quote_rejected' ? "bg-destructive/5 border border-destructive/20" : "bg-success/5 border border-success/20"
                          )}>
                            {selectedRfq.moderationStatus === 'quote_rejected' && (
                              <div className="mb-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                <p className="text-xs font-black uppercase text-destructive mb-1">Admin Rejection Reason</p>
                                <p className="text-sm font-bold text-destructive">{selectedRfq.rejectionReason || 'Price revision required'}</p>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span>Quoted Price:</span>
                              <strong>{formatPrice(selectedRfq.response.price)}/{selectedRfq.unit}</strong>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Lead Time:</span>
                              <strong>{selectedRfq.response.lead_time}</strong>
                            </div>
                            {selectedRfq.response.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">"{selectedRfq.response.notes}"</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Responded on {new Date(selectedRfq.response.respondedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 border-t border-white/5">
                {selectedRfq?.status === 'pending' && (
                  <Button onClick={() => { setDetailsOpen(false); handleOpenResponse(selectedRfq); }}>
                    <Send className="h-4 w-4 mr-2" />
                    Prepare Formal Quote
                  </Button>
                )}
                {selectedRfq?.moderationStatus === 'quote_rejected' && (
                  <Button variant="destructive" onClick={() => { setDetailsOpen(false); handleOpenResponse(selectedRfq); }}>
                    <Send className="h-4 w-4 mr-2" />
                    Revise & Resubmit Quote
                  </Button>
                )}
                 {selectedRfq && selectedRfq.negotiation_step === 'forwarded_to_seller' && (
                   <div className="flex gap-2 w-full justify-start">
                     <Button
                       className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                       onClick={async () => {
                         setIsLoading(true);
                         const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${selectedRfq.id}/seller-accept`, {
                           method: 'POST',
                           headers: { 'Authorization': `Bearer ${localStorage.getItem('jb_token')}` }
                         });
                         if (res.ok) {
                           toast({ title: 'Success', description: 'RFQ terms accepted!' });
                           setDetailsOpen(false);
                           fetchRfqs();
                         }
                         setIsLoading(false);
                       }}
                     >
                       Accept Sourcing Terms
                     </Button>
                     <Button
                       variant="outline"
                       onClick={() => {
                         setVendorCounterPrice(String(selectedRfq.negotiated_price || selectedRfq.target_price || ''));
                         setVendorCounterQty(String(selectedRfq.quantity || ''));
                         setVendorCounterOpen(true);
                       }}
                       className="border-amber-500/20 hover:bg-amber-500/5 text-amber-600 font-bold"
                     >
                       Propose Counter Terms
                     </Button>
                   </div>
                 )}
                 {selectedRfq && ['quoted', 'admin_approved', 'sent_to_buyer'].includes(selectedRfq.status) && selectedRfq.negotiation_step !== 'forwarded_to_seller' && (
                   <Button
                     variant="outline"
                     onClick={() => {
                       setVendorCounterPrice(String(selectedRfq.response?.price || selectedRfq.targetPrice || ''));
                       setVendorCounterQty(String(selectedRfq.quantity || ''));
                       setVendorCounterOpen(true);
                     }}
                     className="border-amber-500/20 hover:bg-amber-500/5 text-amber-600 font-bold"
                   >
                     Propose Counter Sourcing Terms
                   </Button>
                 )}
                <div className="flex gap-2">
                  {selectedRfq && (
                    <Link to={`/vendor/messages?rfqId=${selectedRfq.id}`}>
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

      {/* Send Quote Dialog */}
      <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Submit Quote</DialogTitle>
          </DialogHeader>
          <QuoteForm 
            onSubmit={handleSubmitResponse} 
            isLoading={loading} 
            initialPrice={selectedRfq?.targetPrice}
            initialQuantity={selectedRfq?.quantity}
          />
        </DialogContent>
      </Dialog>

      {/* Clean Custom Sourcing Term Adjustment Dialog Popup for Vendor Counter */}
      <Dialog open={vendorCounterOpen} onOpenChange={setVendorCounterOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propose Counter Sourcing Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="space-y-2">
              <label className="font-semibold text-xs">Counter Unit Price (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={vendorCounterPrice}
                onChange={(e) => setVendorCounterPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-xs">Counter Sourcing Volume *</label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={vendorCounterQty}
                onChange={(e) => setVendorCounterQty(e.target.value)}
              />
            </div>

            {vendorCounterPrice && vendorCounterQty && (
              <div className="p-3 bg-muted rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p className="font-bold border-b pb-1 text-slate-800">Financial Splits Calculation</p>
                <div className="flex justify-between">
                  <span>Product Base Value:</span>
                  <span className="font-bold">₹{(Number(vendorCounterPrice) * Number(vendorCounterQty)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>Platform Commission Fee (10%):</span>
                  <span>- ₹{(Number(vendorCounterPrice) * Number(vendorCounterQty) * 0.10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Expected Vendor Settlement:</span>
                  <span>₹{(Number(vendorCounterPrice) * Number(vendorCounterQty) * 0.90).toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                if (selectedRfq && vendorCounterPrice && vendorCounterQty) {
                  setIsSubmittingVendorCounter(true);
                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${selectedRfq.id}/seller-counter`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('jb_token') || localStorage.getItem('jummababa_token')}`
                    },
                    body: JSON.stringify({ price: Number(vendorCounterPrice), quantity: Number(vendorCounterQty) })
                  }).then(res => {
                    if (res.ok) {
                      toast({ title: 'Counter Terms Proposed', description: 'Adjustment successfully submitted to Admin.' });
                      setVendorCounterOpen(false);
                      setDetailsOpen(false);
                      window.location.reload();
                    }
                  }).finally(() => {
                    setIsSubmittingVendorCounter(false);
                  });
                }
              }}
              disabled={isSubmittingVendorCounter || !vendorCounterPrice || !vendorCounterQty}
              className="w-full bg-b2b-orange hover:bg-b2b-orange/90 text-white font-bold h-11 rounded-xl"
            >
              {isSubmittingVendorCounter ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '⚡ Send Counter proposal to Admin'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
