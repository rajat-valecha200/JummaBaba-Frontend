import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Search, Filter, Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Upload, Info, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/utils';
import { api, apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancel_requested' | 'cancelled';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: string;
  shippingDetails: any;
}

// Order management logic synchronized with database

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: 'New Order', icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase text-[10px] tracking-widest' },
  confirmed: { label: 'Accepted', icon: CheckCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest' },
  shipped: { label: 'In Transit', icon: Truck, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black uppercase text-[10px] tracking-widest' },
  delivered: { label: 'Delivered', icon: Package, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest' },
  cancel_requested: { label: 'Flagged', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive border-destructive/20 font-black uppercase text-[10px] tracking-widest' },
  cancelled: { label: 'Revoked', icon: XCircle, color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-black uppercase text-[10px] tracking-widest' },
};

export default function VendorOrders() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.rfqs.list();
        setDbOrders(data
          .filter((r: any) => r.is_direct_order === true || r.status === 'ordered' || r.status === 'confirmed' || r.status === 'shipped' || r.status === 'delivered' || ['confirmed', 'shipped', 'delivered', 'cancelled', 'cancel_requested'].includes(r.vendor_status))
          .map((r: any) => {
            // Normalize status for UI
            let uiStatus: OrderStatus = 'pending';
            const vStatus = r.vendor_status;
            const cancellationRequest = typeof r.cancellation_request === 'string' ? JSON.parse(r.cancellation_request) : r.cancellation_request;
            if (cancellationRequest?.status === 'pending') {
              uiStatus = 'cancel_requested';
            } else if (['confirmed', 'shipped', 'delivered', 'cancelled'].includes(vStatus)) {
              uiStatus = vStatus as OrderStatus;
            } else if (r.status === 'ordered' || vStatus === 'pending_processing') {
              uiStatus = 'pending';
            } else if (r.status === 'confirmed') {
              uiStatus = 'confirmed';
            } else if (r.status === 'shipped') {
              uiStatus = 'shipped';
            } else if (r.status === 'delivered') {
              uiStatus = 'delivered';
            }

            return {
              id: r.id,
              orderNumber: `RFQ-${r.id.slice(0, 8).toUpperCase()}`,
              buyerName: r.buyer_name || 'Client',
              buyerEmail: r.buyer_email || 'client@jummababa.com',
              buyerPhone: r.buyer_phone || 'N/A',
              items: [{
                productId: r.product_id,
                productName: r.product_name,
                quantity: r.quantity,
                pricePerUnit: Number(r.response_details?.price) || Number(r.target_price) || 0
              }],
              totalAmount: (Number(r.response_details?.price) || Number(r.target_price) || 0) * r.quantity,
              status: uiStatus,
              createdAt: r.created_at,
              shippingAddress: r.delivery_location || 'N/A',
              shippingDetails: r.shipping_details || {}
            };
          }));
      } catch (e) {
        console.error('Vendor orders fetch failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const [orders, setOrders] = useState<Order[]>([]); // For local state updates
  useEffect(() => { setOrders(dbOrders); }, [dbOrders]);

  // Deep link from chat's "Dispatch & Add Shipping Details" (or similar) buttons (?open=<id>) —
  // jump straight to that specific order instead of dropping the vendor on the plain list,
  // which is useless once there are dozens of orders to sift through to find the right one.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || orders.length === 0) return;

    const target = orders.find((o) => String(o.id) === String(openId));
    if (target) {
      setSelectedOrder(target);
    } else {
      toast({ variant: 'destructive', title: 'Order not found', description: "This order isn't in your list — it may not be ready yet or was already handled." });
    }

    const next = new URLSearchParams(searchParams);
    next.delete('open');
    setSearchParams(next, { replace: true });
  }, [orders, searchParams]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [dispatchLocation, setDispatchLocation] = useState('');
  const [shippingProof, setShippingProof] = useState<File | null>(null);
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [cancelRequestSubmitting, setCancelRequestSubmitting] = useState(false);
  // Synchronous guards — a fast double-tap can fire a handler twice before React re-renders
  // with the button disabled, since the setState calls below only take effect next render.
  const orderStatusGuard = useRef<string | null>(null);
  const cancelRequestGuard = useRef(false);
  const shippingProofInputRef = useRef<HTMLInputElement>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (orderStatusGuard.current === orderId) return;
    orderStatusGuard.current = orderId;
    setUpdatingOrderId(orderId);
    try {
      await api.rfqs.updateFulfillment(orderId, {
        status: newStatus,
        shipping_details: {
          trackingNumber,
          shippingCarrier,
          shippingNotes,
          dispatchLocation,
        }
      });

      if (newStatus === 'shipped' && shippingProof) {
        try {
          await api.rfqs.uploadShippingProof(orderId, shippingProof);
        } catch (uploadErr: any) {
          toast({ title: 'Shipping proof upload failed', description: uploadErr.message, variant: 'destructive' });
        }
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: `Order status updated to ${statusConfig[newStatus].label}` });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      // Reset shipping proof after marking as shipped
      if (newStatus === 'shipped') {
        setShippingProof(null);
      }
    } catch (err: any) {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    } finally {
      orderStatusGuard.current = null;
      setUpdatingOrderId(null);
    }
  };

  const handleRequestCancellation = () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast({ title: 'Please provide a reason for cancellation', variant: 'destructive' });
      return;
    }
    if (cancelRequestGuard.current) return;
    cancelRequestGuard.current = true;
    setCancelRequestSubmitting(true);
    api.rfqs.vendorAction(selectedOrder.id, 'request_cancellation', cancelReason).then(() => {
      toast({
        title: 'Cancellation request submitted',
        description: 'Admin will review your request and get back to you.'
      });
      setCancelRequestOpen(false);
      setCancelReason('');
      // Refresh orders
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancel_requested' } : o));
    }).catch((error: any) => {
      toast({ title: 'Failed to submit request', description: error.message, variant: 'destructive' });
    }).finally(() => {
      cancelRequestGuard.current = false;
      setCancelRequestSubmitting(false);
    });
  };

  const handleShippingProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({ title: 'Please upload an image (JPG, PNG, WEBP) or PDF file', variant: 'destructive' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File size must be less than 5MB', variant: 'destructive' });
        return;
      }
      setShippingProof(file);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered',
      delivered: null,
      cancel_requested: null,
      cancelled: null,
    };
    if (selectedOrder?.status === 'cancel_requested') return null;
    return flow[currentStatus];
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  // Order Detail View
  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order {selectedOrder.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrderTracking
              currentStatus={selectedOrder.status}
              orderNumber={selectedOrder.orderNumber}
              orderDate={selectedOrder.createdAt}
              shippingCarrier={selectedOrder.shippingDetails?.shippingCarrier}
              trackingNumber={selectedOrder.shippingDetails?.trackingNumber}
              shippedAt={selectedOrder.shippingDetails?.shippedAt}
              deliveredAt={selectedOrder.shippingDetails?.deliveredAt}
              dispatchLocation={selectedOrder.shippingDetails?.dispatchLocation}
            />
          </div>

          <div className="space-y-4">
            {/* Order Actions Card */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
                <CardTitle className="text-lg">Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrder.status === 'pending' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-2">
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                      <Clock className="h-4 w-4" /> Action Required
                    </div>
                    <p className="text-xs text-amber-600/80 leading-relaxed">The buyer has accepted your quote. Please <strong>Confirm Order</strong> below to start processing and shipping.</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {selectedOrder.status === 'confirmed' && (
                  <div className="space-y-3 pt-2">
                    <Separator />
                    <p className="text-sm font-medium">Add Shipping Details</p>
                    <div className="space-y-2">
                      <Label htmlFor="carrier">Shipping Carrier</Label>
                      <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                        <SelectTrigger id="carrier">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bluedart">BlueDart Express</SelectItem>
                          <SelectItem value="delhivery">Delhivery</SelectItem>
                          <SelectItem value="dtdc">DTDC</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="self">Self Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tracking">Tracking Number</Label>
                      <Input
                        id="tracking"
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Shipping Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes..."
                        value={shippingNotes}
                        onChange={(e) => setShippingNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dispatch">Dispatch City/Warehouse *</Label>
                      <Input
                        id="dispatch"
                        placeholder="e.g. Bhiwandi Hub, Mumbai"
                        value={dispatchLocation}
                        onChange={(e) => setDispatchLocation(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground italic">Required to show buyer where the shipment started.</p>
                    </div>
                    {/* Shipping Proof Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="shipping-proof">Upload Shipping Proof (Optional)</Label>
                      <p className="text-xs text-muted-foreground">LR / Receipt - Image or PDF (max 5MB)</p>
                      <input
                        ref={shippingProofInputRef}
                        type="file"
                        id="shipping-proof"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleShippingProofChange}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => shippingProofInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {shippingProof ? shippingProof.name : 'Choose File'}
                      </Button>
                    </div>
                  </div>
                )}

                {getNextStatus(selectedOrder.status) && (
                  <Button
                    className="w-full"
                    onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                    disabled={updatingOrderId === selectedOrder.id}
                  >
                    {selectedOrder.status === 'pending' && (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Order
                      </>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </>
                    )}
                    {selectedOrder.status === 'shipped' && (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </>
                    )}
                  </Button>
                )}

                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                  <Button
                    variant="outline"
                    className="w-full text-warning hover:text-warning"
                    onClick={() => setCancelRequestOpen(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Request Cancellation
                  </Button>
                )}
                
                {selectedOrder.status === 'cancel_requested' && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm font-medium text-destructive">
                      A cancellation request is pending admin review. Actions are restricted.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Cancellation requests are reviewed by admin. Direct order cancellation is not allowed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Buyer Info Card */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Buyer Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selectedOrder.buyerName}</p>
                  <p className="text-muted-foreground">{selectedOrder.buyerEmail}</p>
                  <p className="text-muted-foreground">{selectedOrder.buyerPhone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
              </CardContent>
            </Card>

            {/* Order Summary Card */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.productName} × {item.quantity}
                        </span>
                        <span>{formatPrice(item.quantity * item.pricePerUnit)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
          <h1 className="text-3xl font-black uppercase tracking-tighter">Order Fulfillment</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Execute and track your successful quotes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{pendingCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">To Confirm</p>
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
                <div className="text-2xl font-black">{confirmedCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Truck className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{shippedCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En Route</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{deliveredCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl  shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative z-10 border-b border-border/50 bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Fulfillment Queue</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancel_requested">Cancel Requested</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{order.buyerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.items.length} item(s)</TableCell>
                  <TableCell className="font-medium">{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getNextStatus(order.status) && order.status !== 'cancel_requested' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingOrderId === order.id}
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        >
                          {order.status === 'pending' && 'Confirm'}
                          {order.status === 'confirmed' && 'Ship'}
                          {order.status === 'shipped' && 'Deliver'}
                        </Button>
                      )}
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Request Dialog */}
      <Dialog open={cancelRequestOpen} onOpenChange={setCancelRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Order Cancellation</DialogTitle>
            <DialogDescription>
              Submit a cancellation request for order {selectedOrder?.orderNumber}. Admin will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-warning/10 border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription>
                Cancellation requests are reviewed by admin. Direct order cancellation is not allowed.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please explain why you want to cancel this order..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestCancellation} disabled={cancelRequestSubmitting}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
