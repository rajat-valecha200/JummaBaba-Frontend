import { useState, useEffect } from 'react';
import { Eye, Download, ArrowLeft, Truck, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { OrderTracking } from '@/components/orders/OrderTracking';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'New Order', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase text-[10px] tracking-widest' },
  confirmed: { label: 'Processing', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest' },
  ordered: { label: 'Processing', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest' },
  shipped: { label: 'In Transit', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black uppercase text-[10px] tracking-widest' },
  delivered: { label: 'Delivered', color: 'bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase text-[10px] tracking-widest' },
  completed: { label: 'Delivered', color: 'bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase text-[10px] tracking-widest' },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-black uppercase text-[10px] tracking-widest' },
};

export default function BuyerOrders() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.orders.listBuyer();
        const normalized = data.map((o: any) => ({
          ...o,
          orderNumber: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
          totalAmount: Number(o.target_price || 0) * Number(o.quantity || 1),
          items: [{
            productName: o.product_name || 'Industrial Product',
            quantity: o.quantity || 1,
            pricePerUnit: Number(o.target_price || 0)
          }],
          shippingAddress: o.delivery_location || 'Address on file',
          createdAt: o.created_at || o.createdAt,
          shippingDetails: o.shipping_details || {}
        }));
        setDbOrders(normalized);
      } catch (e) {
        console.error('Orders fetch failed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert("Please select a star rating");
      return;
    }
    try {
      setIsSubmittingFeedback(true);
      await api.orders.submitFeedback(selectedOrderId!, { rating, text: feedbackText });
      // Update local state
      setDbOrders(dbOrders.map(o => o.id === selectedOrderId ? { ...o, feedback_rating: rating, feedback_text: feedbackText } : o));
      setFeedbackOpen(false);
      alert("Thank you for your feedback!");
    } catch (err) {
      alert("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const selectedOrder = dbOrders.find(o => o.id === selectedOrderId);
  const supplier = selectedOrder?.vendor || { companyName: 'Verified Supplier' };

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Order {selectedOrder.orderNumber}</h1>
              {statusConfig[selectedOrder.status] && (
                <Badge className={statusConfig[selectedOrder.status].color}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              )}
            </div>
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
              currentStatus={selectedOrder.status as any}
              orderNumber={selectedOrder.orderNumber}
              orderDate={selectedOrder.createdAt}
              shippingCarrier={selectedOrder.shippingDetails?.shippingCarrier}
              trackingNumber={selectedOrder.shippingDetails?.trackingNumber}
              shippedAt={selectedOrder.shippingDetails?.shippedAt}
              deliveredAt={selectedOrder.shippingDetails?.deliveredAt}
              dispatchLocation={selectedOrder.shippingDetails?.dispatchLocation}
            />

            {/* Logistics Information Section for Buyer */}
            {(selectedOrder.shipping_details?.trackingNumber || selectedOrder.shipping_details?.awb) && (
              <Card className="mt-6 border-primary/20 bg-primary/5 rounded-2xl overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest">Tracking Details</h3>
                      <p className="text-[10px] font-bold uppercase opacity-70">Your package is en route</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-xl border border-primary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Carrier</p>
                      <p className="font-bold text-slate-900">{selectedOrder.shipping_details.shippingCarrier || 'Standard Partner'}</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl border border-primary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tracking Number</p>
                      <p className="font-black text-primary">{selectedOrder.shipping_details.trackingNumber || selectedOrder.shipping_details.awb}</p>
                    </div>
                  </div>
                  {selectedOrder.shipping_details.shippingNotes && (
                    <div className="mt-4 p-3 bg-white/30 rounded-lg text-xs italic text-muted-foreground">
                      Note from Seller: "{selectedOrder.shipping_details.shippingNotes}"
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
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

            {/* Shipping Address Card */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
              </CardContent>
            </Card>

            {/* Actual Seller Information */}
            <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-slate-500 text-xs uppercase tracking-widest">Seller Details</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-xs text-primary font-black uppercase tracking-tighter mb-1">Verified Vendor</p>
                    <p className="font-black text-lg text-slate-900 leading-tight">
                      {selectedOrder.vendor_business_name || selectedOrder.vendor_name || 'Premium Verified Supplier'}
                    </p>
                  </div>
                  <div className="px-1 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform Facilitator</p>
                    <p className="text-sm font-medium text-slate-600">
                      <span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba<span className="text-b2b-orange">.com</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full border-primary/30 text-primary hover:bg-primary/5 font-bold"
                onClick={() => {
                  window.location.href = `/messages?rfqId=${selectedOrder.id}`;
                }}
              >
                <span className="mr-2">💬</span>
                Open Sourcing Chat
              </Button>

              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              
              {(selectedOrder.status === 'delivered' || selectedOrder.status === 'completed') && (
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  onClick={() => {
                    setRating(selectedOrder.feedback_rating || 0);
                    setFeedbackText(selectedOrder.feedback_text || '');
                    setFeedbackOpen(true);
                  }}
                  disabled={selectedOrder.feedback_rating > 0}
                >
                  <Star className={cn("h-4 w-4 mr-2", selectedOrder.feedback_rating > 0 && "fill-white")} />
                  {selectedOrder.feedback_rating > 0 ? 'Feedback Submitted' : 'Rate & Review Order'}
                </Button>
              )}

              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'completed' && (
                <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Dialog */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                How was the quality and delivery of your order?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star
                        className={cn(
                          "h-10 w-10 transition-colors",
                          (hover || rating) >= star 
                            ? "fill-amber-500 text-amber-500" 
                            : "text-slate-200"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Great"}
                  {rating === 5 && "Excellent"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Tell us more (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your experience with the product and delivery..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
              <Button 
                className="bg-primary text-white font-bold px-8"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || rating === 0}
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">{dbOrders.length} orders found</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dbOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate">{order.items[0].productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {order.items[0].quantity}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {statusConfig[order.status] ? (
                        <Badge className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{order.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
