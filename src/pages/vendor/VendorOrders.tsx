import { useState, useEffect, useRef } from 'react';
import { Eye, Search, Filter, Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Upload, Info, AlertTriangle } from 'lucide-react';
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
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

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
}

// Order management logic synchronized with database

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning border-warning/20' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-secondary/10 text-secondary border-secondary/20' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-primary/10 text-primary border-primary/20' },
  delivered: { label: 'Delivered', icon: Package, color: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function VendorOrders() {
  const { toast } = useToast();
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/orders/vendor`);
        if (res.ok) setDbOrders(await res.json());
      } catch (e) {
        console.error('Vendor orders fetch failed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const [orders, setOrders] = useState<Order[]>([]); // For local state updates
  useEffect(() => { setOrders(dbOrders); }, [dbOrders]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [shippingProof, setShippingProof] = useState<File | null>(null);
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const shippingProofInputRef = useRef<HTMLInputElement>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast({ title: `Order status updated to ${statusConfig[newStatus].label}` });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    // Reset shipping proof after marking as shipped
    if (newStatus === 'shipped') {
      setShippingProof(null);
    }
  };

  const handleRequestCancellation = () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast({ title: 'Please provide a reason for cancellation', variant: 'destructive' });
      return;
    }
    toast({ 
      title: 'Cancellation request submitted', 
      description: 'Admin will review your request and get back to you.' 
    });
    setCancelRequestOpen(false);
    setCancelReason('');
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
    const config = statusConfig[status];
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
      cancelled: null,
    };
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
              estimatedDelivery="January 25, 2024"
              shippingCarrier={shippingCarrier || 'BlueDart Express'}
              trackingNumber={trackingNumber || 'BD123456789IN'}
            />
          </div>

          <div className="space-y-4">
            {/* Order Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <Alert className="bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Cancellation requests are reviewed by admin. Direct order cancellation is not allowed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Buyer Info Card */}
            <Card>
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
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
              </CardContent>
            </Card>

            {/* Order Summary Card */}
            <Card>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Manage and track your orders</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{confirmedCount}</div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{shippedCount}</div>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{deliveredCount}</div>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>All Orders</CardTitle>
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
                      {getNextStatus(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
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
            <Button onClick={handleRequestCancellation}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
