import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Star,
  MapPin,
  Building,
  User,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await api.orders.listBuyer(); // Base API
      const found = data.find((o: any) => o.id === id);
      if (found) {
        setOrder({
          ...found,
          orderNumber: `ORD-${found.id.slice(0, 8).toUpperCase()}`,
          shippingDetails: found.shipping_details || {}
        });
      }
    } catch (e) {
      console.error('Order fetch failed', e);
      toast({ title: 'Error', description: 'Failed to fetch order details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleForward = async () => {
    if (!order) return;
    try {
      setIsForwarding(true);
      await api.rfqs.forward(order.id, order.supplier_id);
      toast({ title: 'Success', description: 'Order forwarded to seller' });
      fetchOrder();
    } catch (error: any) {
      toast({ title: 'Forwarding Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsForwarding(false);
    }
  };

  const getStatusBadge = (order: any) => {
    const status = order.status;
    const config: any = {
      pending: { label: 'Awaiting Moderation', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      ordered: { label: 'Forwarded', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      confirmed: { label: 'Accepted', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
      shipped: { label: 'In Transit', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
      delivered: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
      completed: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
      cancelled: { label: 'Cancelled', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
    };

    const style = config[status] || config.pending;
    return (
      <Badge className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest", style.color)}>
        {style.label}
      </Badge>
    );
  };

  const renderTimeline = (order: any) => {
    const steps = [
      { id: 'placed', label: 'Order Placed', date: order.created_at, status: 'completed' },
      { id: 'forwarded', label: 'Admin Forwarded', date: order.moderation_status === 'forwarded' ? order.updated_at : null, status: order.moderation_status === 'forwarded' ? 'completed' : 'pending' },
      { id: 'accepted', label: 'Vendor Accepted', date: ['confirmed', 'shipped', 'delivered', 'completed'].includes(order.status) ? order.updated_at : null, status: ['confirmed', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'completed' : 'pending' },
      { id: 'shipped', label: 'Shipped', date: order.shippingDetails?.shippedAt, status: ['shipped', 'delivered', 'completed'].includes(order.status) ? 'completed' : 'pending' },
      { id: 'delivered', label: 'Delivered', date: order.shippingDetails?.deliveredAt, status: ['delivered', 'completed'].includes(order.status) ? 'completed' : 'pending' },
    ];

    return (
      <div className="mt-8 space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Info className="h-3 w-3" /> Fulfillment Journey
        </h4>
        <div className="space-y-4 ml-2 border-l-2 border-slate-100 pl-6 py-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative">
              <div className={cn(
                "absolute -left-[33px] w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white",
                step.status === 'completed' ? "border-primary bg-primary text-white" : "border-slate-200"
              )}>
                {step.status === 'completed' ? <CheckCircle className="h-2.5 w-2.5" /> : <div className="w-1 h-1 bg-slate-200 rounded-full" />}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  step.status === 'completed' ? "text-slate-900" : "text-slate-400"
                )}>{step.label}</span>
                {step.date && (
                  <span className="text-[10px] text-slate-500">
                    {new Date(step.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/orders')} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{order.orderNumber}</h1>
              {getStatusBadge(order)}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        {order.moderation_status === 'pending_moderation' && (
          <Button 
            className="bg-primary text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-primary/20"
            onClick={handleForward}
            disabled={isForwarding}
          >
            {isForwarding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
            FORWARD TO SELLER
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Tracking & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <OrderTracking
            currentStatus={order.status as any}
            orderNumber={order.orderNumber}
            orderDate={order.created_at}
            shippingCarrier={order.shippingDetails?.shippingCarrier}
            trackingNumber={order.shippingDetails?.trackingNumber}
            shippedAt={order.shippingDetails?.shippedAt}
            deliveredAt={order.shippingDetails?.deliveredAt}
            dispatchLocation={order.shippingDetails?.dispatchLocation}
          />

          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{order.product_name}</h3>
                  <p className="text-sm text-slate-500">Quantity: {order.quantity} units</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900">{formatPrice(order.target_price * order.quantity)}</p>
                  <p className="text-xs text-slate-500">{formatPrice(order.target_price)} per unit</p>
                </div>
              </div>
              <Separator className="bg-slate-50 mb-6" />
              {renderTimeline(order)}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stakeholders & Feedback */}
        <div className="space-y-6">
          {/* Stakeholders Card */}
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Stakeholders</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <User className="h-3 w-3" /> Buyer
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.buyer_name || 'Verified Client'}</p>
                  <p className="text-xs text-slate-500">{order.buyer_email}</p>
                  <div className="flex items-start gap-2 mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <MapPin className="h-3 w-3 mt-0.5 text-slate-400" />
                    <p>{order.delivery_location || 'Address on file'}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Building className="h-3 w-3" /> Vendor
                </div>
                <div>
                  <p className="font-bold text-primary">{order.vendor_business_name || 'Premium Supplier'}</p>
                  <p className="text-xs text-slate-500">Partner ID: {order.supplier_id?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          {(order.feedback_rating || order.feedback_text) ? (
            <Card className="border-none shadow-sm bg-amber-50 rounded-2xl overflow-hidden">
              <CardHeader className="bg-amber-100 py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-700">Buyer Feedback</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn(
                        "h-5 w-5", 
                        s <= (order.feedback_rating || 0) ? "fill-amber-500 text-amber-500" : "text-amber-200"
                      )} 
                    />
                  ))}
                </div>
                {order.feedback_text ? (
                  <div className="bg-white/50 p-4 rounded-xl border border-amber-200/50">
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                      "{order.feedback_text}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium italic">No comment provided.</p>
                )}
              </CardContent>
            </Card>
          ) : order.status === 'completed' || order.status === 'delivered' ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50 rounded-2xl">
              <CardContent className="p-8 text-center">
                <Star className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Feedback</p>
                <p className="text-[10px] text-slate-400 mt-1">Buyer has not rated this order yet.</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Logistics Summary Card */}
          {order.shippingDetails?.trackingNumber && (
            <Card className="border-none shadow-sm bg-indigo-50 rounded-2xl overflow-hidden">
              <CardHeader className="bg-indigo-100 py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-700">Logistics Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-400">Carrier</p>
                    <p className="text-sm font-bold text-slate-900">{order.shippingDetails.shippingCarrier || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-400">Origin</p>
                    <p className="text-sm font-bold text-slate-900">{order.shippingDetails.dispatchLocation || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-indigo-400">Tracking Number</p>
                  <p className="font-black text-primary text-lg tracking-tight">{order.shippingDetails.trackingNumber}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
