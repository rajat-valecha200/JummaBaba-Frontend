import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Package,
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  Truck,
  ArrowUpRight,
  Settings
} from 'lucide-react';
import { RfqTimeline, getRfqSteps } from '@/components/b2b/RfqTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { Separator } from '@/components/ui/separator';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  responded: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  ordered: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  confirmed: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  shipped: 'bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  delivered: 'bg-success/10 text-success border-success/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  closed: 'bg-muted text-muted-foreground border-border/50 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20 font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-widest',
};

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
          <span>Your Original Target Price:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{Number(rfq.target_price).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default function BuyerRfqs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  const fetchRfqs = async () => {
    try {
      const data = await api.rfqs.list();
      // Hard-parse response_details to ensure accurate pricing display
      const normalizedData = data.map((r: any) => {
        let details = typeof r.response_details === 'string' 
          ? JSON.parse(r.response_details) 
          : r.response_details || {};
        
        if (details.response_details && typeof details.response_details === 'object') {
          details = { ...details, ...details.response_details };
        }

        return {
          ...r,
          response_details: details
        };
      });
      setRfqs(normalizedData);
    } catch (e) {
      console.error('RFQs failed fetch', e);
      toast({ title: 'Error', description: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleAction = async (id: string, action: 'accept_quote' | 'reject_quote' | 'request_cancellation' | 'confirm_delivery') => {
    setIsLoading(true);
    try {
      if (action === 'accept_quote') {
        await api.rfqs.acceptQuote(id);
      } else {
        await api.rfqs.buyerAction(id, action);
      }

      const toastCopy = {
        accept_quote: { title: 'Order Placed!', description: 'Your order has been sent to the supplier.' },
        reject_quote: { title: 'Quote Declined', description: 'The request has been closed.' },
        request_cancellation: { title: 'Cancellation Requested', description: 'Your request has been sent for admin review.' },
        confirm_delivery: { title: 'Delivery Confirmed', description: 'Thanks for confirming! Funds have been released to the supplier.' },
      }[action];

      toast(toastCopy);
      setDetailsOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter inquiries into Active (In-Progress) and History (Finalized)
  const inquiries = rfqs.filter(r => r.is_direct_order !== true);
  // 'delivered' still needs the buyer to confirm receipt, so it stays Active; only
  // 'completed' (buyer-confirmed) and terminal states move to History.
  const activeRfqs = inquiries.filter(r => !['completed', 'cancelled', 'closed'].includes(r.status));
  const history = inquiries.filter(r => ['completed', 'cancelled', 'closed'].includes(r.status));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const RfqTable = ({ data }: { data: any[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Target Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quote</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No items found
              </TableCell>
            </TableRow>
          ) : (
            data.map(rfq => (
              <TableRow key={rfq.id}>
                <TableCell>
                  <p className="font-medium">{rfq.product_name}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {rfq.description}
                  </p>
                </TableCell>
                <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                <TableCell>{rfq.target_price ? formatPrice(rfq.target_price) : '-'}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[rfq.status], "shadow-sm")} variant="secondary">
                    {rfq.status}
                  </Badge>
                  {rfq.cancellation_request?.status === 'pending' && (
                    <Badge variant="outline" className="ml-2 border-destructive text-destructive animate-pulse">
                      Cancel Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {rfq.moderation_status === 'quote_approved' ? (
                    <Badge className="bg-blue-500 text-white font-black animate-bounce shadow-lg shadow-blue-500/20">Quote Ready</Badge>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic">
                      {rfq.moderation_status === 'quote_pending' ? 'Reviewing' : 'Waiting...'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedRfq(rfq); setDetailsOpen(true); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Requests</h1>
          <p className="text-muted-foreground">Manage your sourcing and orders</p>
        </div>
        <Button asChild>
          <Link to="/post-requirement">
            <Plus className="h-4 w-4 mr-2" />
            New RFQ
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
          <TabsTrigger value="active">Active RFQs</TabsTrigger>
          <TabsTrigger value="history">Past Requests</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <TabsContent value="active" className="p-0">
            <RfqTable data={activeRfqs} />
          </TabsContent>
          <TabsContent value="history" className="p-0">
            <RfqTable data={history} />
          </TabsContent>
        </Card>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl border-border/50 bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="flex h-[80vh]">
            <div className="w-80 flex-shrink-0 border-r border-border/50 bg-slate-50/50 p-8 hidden md:block">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8">Purchase Lifecycle</h3>
              {selectedRfq && (
                <RfqTimeline steps={getRfqSteps(selectedRfq.status, selectedRfq.moderation_status)} />
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <DialogHeader className="p-8 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <DialogTitle className="text-2xl font-black tracking-tighter truncate">Inquiry Status</DialogTitle>
                  {selectedRfq && <Badge className={cn(statusColors[selectedRfq.status], "flex-shrink-0")}>{selectedRfq.status}</Badge>}
                </div>
                <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest break-all">
                  Reference ID: {selectedRfq?.id}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-8 space-y-6">
                {selectedRfq && (
                  <div className="space-y-6">
                    {/* Success Banner for Converted Orders */}
                    {selectedRfq.status === 'ordered' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-emerald-600 leading-tight">Order Confirmed!</h4>
                          <p className="text-sm font-medium text-emerald-600/80">Your inquiry has been successfully converted into an order. The vendor <span className="font-bold underline">{selectedRfq.vendor_business_name || 'Verified Supplier'}</span> has been notified to start processing.</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Package className="h-4 w-4 text-primary" /> Product Information
                        </div>
                        <p className="text-sm font-medium">{selectedRfq.product_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedRfq.quantity} {selectedRfq.unit} @ {formatPrice(selectedRfq.target_price)}/unit</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Clock className="h-4 w-4 text-primary" /> Lifecycle Status
                        </div>
                        <Badge className={statusColors[selectedRfq.status]} variant="secondary">
                          Business: {selectedRfq.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Moderation: {selectedRfq.moderation_status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {selectedRfq.negotiation_step && selectedRfq.negotiation_step !== 'rfq_submitted' && (
                      <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-black text-lg">
                          <Settings className="h-5 w-5" /> Negotiated Terms Proximity Card
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase">Proposed Price Per Unit</p>
                            <p className="text-xl font-bold text-amber-600">{formatPrice(selectedRfq.negotiated_price)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase">Proposed Volume</p>
                            <p className="text-xl font-bold text-slate-800">{selectedRfq.negotiated_quantity} units</p>
                          </div>
                        </div>

                        {/* Breakdown calculations disclosure */}
                        <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-900 border-b pb-1">
                            <span>Quotation Breakdown Details</span>
                            <span>Value</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-muted-foreground">Total Product Value:</span>
                            <span className="text-slate-800">{formatPrice(Number(selectedRfq.negotiated_price) * Number(selectedRfq.negotiated_quantity))}</span>
                          </div>
                        </div>

                        {selectedRfq.negotiation_step === 'admin_modified' && (
                          <div className="pt-2 flex flex-col gap-2">
                            <Button 
                              onClick={() => {
                                setIsSubmittingCounter(true);
                                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${selectedRfq.id}/buyer-confirm`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                                  },
                                  body: JSON.stringify({ source: 'admin' })
                                }).then(res => {
                                  if (res.ok) {
                                    toast({ title: 'Quotation Terms Confirmed!', description: 'Adjusted specs confirmed.' });
                                    setDetailsOpen(false);
                                    fetchRfqs();
                                  }
                                }).finally(() => {
                                  setIsSubmittingCounter(false);
                                });
                              }}
                              disabled={isSubmittingCounter}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
                            >
                              {isSubmittingCounter ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✓ Confirm Adjusted Sourcing Terms'}
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setCounterPrice(String(selectedRfq.negotiated_price || selectedRfq.target_price || ''));
                                setCounterQty(String(selectedRfq.negotiated_quantity || selectedRfq.quantity || ''));
                                setCounterOpen(true);
                              }}
                              disabled={isSubmittingCounter}
                              className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/5 font-bold text-xs py-2 rounded-xl"
                            >
                              Propose Counter Terms (Negotiate)
                            </Button>
                          </div>
                        )}

                        {selectedRfq.negotiation_step === 'admin_approved_seller_counter' && (
                          <div className="pt-2">
                            <Button 
                              onClick={() => {
                                setIsSubmittingCounter(true);
                                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${selectedRfq.id}/buyer-confirm`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                                  },
                                  body: JSON.stringify({ source: 'seller' })
                                }).then(res => {
                                  if (res.ok) {
                                    toast({ title: 'Quotation Terms Confirmed!', description: 'Adjusted specs confirmed.' });
                                    setDetailsOpen(false);
                                    fetchRfqs();
                                  }
                                }).finally(() => {
                                  setIsSubmittingCounter(false);
                                });
                              }}
                              disabled={isSubmittingCounter}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
                            >
                              {isSubmittingCounter ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✓ Confirm Seller Counter Sourcing Terms'}
                            </Button>
                          </div>
                        )}

                        {selectedRfq.negotiation_step === 'buyer_countered' && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center text-xs text-amber-600 dark:text-amber-400 font-bold">
                            ⚡ Counter terms proposed. Awaiting Admin Approval.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedRfq.moderation_status === 'quote_approved' && Number(selectedRfq.response_details?.price) > 0 && (
                      <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-primary font-black text-lg">
                              <CheckCircle className="h-6 w-6" /> Approved Supplier Quote
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest px-8">
                              From: <span className="text-slate-900">{selectedRfq.vendor_business_name || selectedRfq.vendor_name || 'Verified Premium Supplier'}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Quoted Price</p>
                            <p className="text-3xl font-bold text-primary">{formatPrice(selectedRfq.response_details.price)}</p>
                            <p className="text-xs text-muted-foreground">Total: {formatPrice(selectedRfq.response_details.price * selectedRfq.quantity)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Lead Time</p>
                            <p className="text-xl font-semibold">{selectedRfq.response_details.lead_time || 'Immediate'}</p>
                          </div>
                        </div>

                        {/* Cost breakdown details for RFQ quotes */}
                        <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-900 border-b pb-1">
                            <span>Quotation Breakdown Details</span>
                            <span>Value</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-muted-foreground">Total Product Value:</span>
                            <span className="text-slate-800">{formatPrice(selectedRfq.response_details.price * selectedRfq.quantity)}</span>
                          </div>
                        </div>
                        
                        {selectedRfq.response_details.notes && (
                          <div className="pt-2">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Seller Terms</p>
                            <p className="text-sm italic">"{selectedRfq.response_details.notes}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {['ordered', 'confirmed', 'shipped', 'delivered'].includes(selectedRfq.status) && (
                      <div className="space-y-4 pt-4">
                        <Separator />
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Order Fulfillment</h4>
                        <OrderTracking
                          currentStatus={selectedRfq.status}
                          orderNumber={`ORD-${selectedRfq.id.slice(0, 8).toUpperCase()}`}
                          orderDate={selectedRfq.created_at}
                          shippingCarrier={selectedRfq.shipping_details?.shippingCarrier}
                          trackingNumber={selectedRfq.shipping_details?.trackingNumber}
                          shippedAt={selectedRfq.shipping_details?.shippedAt}
                          deliveredAt={selectedRfq.shipping_details?.deliveredAt}
                          dispatchLocation={selectedRfq.shipping_details?.dispatchLocation}
                        />

                        {selectedRfq.vendor_status === 'delivered' && !selectedRfq.buyer_acknowledged && (
                          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-xl space-y-3">
                            <p className="text-xs font-bold text-amber-700">
                              The supplier has marked this shipment as delivered. Have you received your cargo?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex-1"
                                disabled={isLoading}
                                onClick={() => handleAction(selectedRfq.id, 'confirm_delivery')}
                              >
                                📦 Confirm Receipt
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedRfq.moderation_status !== 'quote_approved' && !selectedRfq.negotiated_price && (
                      <div className="p-6 border-dashed border-2 rounded-xl flex flex-col items-center justify-center text-center py-12 bg-muted/20">
                        <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <h4 className="font-medium text-muted-foreground">Waiting for Supplier Quotation</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                          Once the admin approves the seller's quote, it will appear here for your final approval.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
 
              <DialogFooter className="p-8 border-t border-white/5 flex-col sm:flex-col items-stretch sm:justify-start sm:space-x-0 gap-3">
                <div className="flex flex-col gap-2 w-full">
                  {selectedRfq?.negotiation_step === 'payment_pending' && (
                    <div className="flex flex-col gap-3 w-full bg-slate-50 p-4 rounded-xl border border-indigo-100 text-xs">
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Sourcing Invoice & Payment Request</p>

                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Base Cost:</span>
                          <span>₹{(Number(selectedRfq.target_price) * Number(selectedRfq.quantity)).toLocaleString()}</span>
                        </div>
                        {selectedRfq.response_details?.payment_breakdown && (
                          <>
                            {Number(selectedRfq.response_details.payment_breakdown.discountAmount) > 0 && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Discount ({selectedRfq.response_details.payment_breakdown.discountPercentage}% off):</span>
                                <span>-₹{Number(selectedRfq.response_details.payment_breakdown.discountAmount).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[10px]">
                              <span>Platform Fee:</span>
                              <span>₹{Number(selectedRfq.response_details.payment_breakdown.platformFee).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>GST Tax (18%):</span>
                              <span>₹{Number(selectedRfq.response_details.payment_breakdown.gst).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between font-bold border-t pt-1.5 mt-1 text-indigo-600 text-sm">
                          <span>Total Amount Payable:</span>
                          <span>
                            ₹{selectedRfq.response_details?.payment_breakdown
                              ? Math.round(Number(selectedRfq.response_details.payment_breakdown.finalAmount)).toLocaleString()
                              : Math.round((Number(selectedRfq.target_price) * Number(selectedRfq.quantity)) * 1.28).toLocaleString()
                            }
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 text-xs"
                        onClick={() => navigate(`/buyer/rfq-payment/${selectedRfq.id}`)}
                        disabled={isLoading}
                      >
                        Proceed to Payment Confirmation →
                      </Button>
                    </div>
                  )}
                  {selectedRfq?.negotiation_step === 'payment_submitted' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3 text-xs w-full text-center text-yellow-700 font-bold">
                      ⏳ Payment reference submitted. Support is verifying transaction receipts.
                    </div>
                  )}
                  {selectedRfq?.status === 'ordered' && selectedRfq.cancellation_request?.status !== 'pending' && (
                    <Button variant="outline" className="text-destructive" onClick={() => handleAction(selectedRfq.id, 'request_cancellation')}>
                      <AlertCircle className="h-4 w-4 mr-2" /> Request Cancellation
                    </Button>
                  )}
                  {selectedRfq?.cancellation_request?.status === 'pending' && (
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                      <AlertCircle className="h-4 w-4" /> Cancellation Pending Admin Review
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {selectedRfq && (
                    <Link to={`/buyer/rfqs/${selectedRfq.id}`}>
                      <Button variant="outline" className="font-bold gap-2 text-xs py-2 rounded-xl">
                        <FileText className="h-4 w-4" /> Full Audit Trail
                      </Button>
                    </Link>
                  )}
                  {selectedRfq && (
                    <Link to={`/buyer/messages?chatGroupId=${selectedRfq.order_group_id || selectedRfq.negotiation_group_id || ''}&rfqId=${selectedRfq.id}`}>
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

      {/* Clean Custom Sourcing Term Adjustment Dialog Popup for Buyer Counter */}
      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propose Counter Sourcing Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <CatalogSlabDialogBanner rfq={selectedRfq} />

            <div className="space-y-2">
              <label className="font-semibold text-xs">Counter Unit Price (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-xs">Counter Sourcing Volume *</label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={counterQty}
                onChange={(e) => setCounterQty(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                Counter Proposal Reason / Remark *
              </label>
              <Textarea
                placeholder="Explain why terms were counter-proposed (e.g. Target budget constraints, custom volume adjustment)..."
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            {counterPrice && counterQty && (
              <div className="p-3 bg-muted rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p className="font-bold border-b pb-1 text-slate-800">New Estimated Valuation</p>
                <div className="flex justify-between font-bold">
                  <span>Gross Product Price Value:</span>
                  <span>₹{(Number(counterPrice) * Number(counterQty)).toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                if (selectedRfq && counterPrice && counterQty && counterNotes.trim()) {
                  setIsSubmittingCounter(true);
                  try {
                    await api.rfqs.buyerConfirm(selectedRfq.id, 'buyer_counter', Number(counterPrice), Number(counterQty), counterNotes.trim());
                    toast({ title: 'Counter-Proposal Sent', description: 'Modified quotation terms submitted for admin approval.' });
                    setCounterOpen(false);
                    setDetailsOpen(false);
                    setCounterNotes('');
                    fetchRfqs();
                  } catch (err: any) {
                    toast({ title: 'Failed to send counter-proposal', description: err.message, variant: 'destructive' });
                  } finally {
                    setIsSubmittingCounter(false);
                  }
                }
              }}
              disabled={isSubmittingCounter || !counterPrice || !counterQty || !counterNotes.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              {isSubmittingCounter ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Dispatch Counter Sourcing Terms'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
