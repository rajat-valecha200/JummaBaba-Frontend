import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
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
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { Separator } from '@/components/ui/separator';

export default function AdminOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await api.orders.listBuyer();
      // Filter for direct orders or confirmed RFQ orders
      const normalized = data.map((o: any) => ({
        ...o,
        orderNumber: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
        shippingDetails: o.shipping_details || {}
      }));
      setOrders(normalized);
    } catch (e) {
      console.error('Orders failed fetch', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = 
      (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.product_name && o.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (order: any) => {
    if (order.moderation_status === 'pending_moderation') {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase text-[10px] tracking-widest">Awaiting Admin</Badge>;
    }
    
    const status = order.status;
    switch (status) {
      case 'completed':
      case 'delivered': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase text-[10px] tracking-widest">Delivered</Badge>;
      case 'shipped': return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black uppercase text-[10px] tracking-widest animate-pulse">In Transit</Badge>;
      case 'ordered': 
      case 'confirmed': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase text-[10px] tracking-widest">Processing</Badge>;
      case 'cancelled': return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-black uppercase text-[10px] tracking-widest">Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 font-black uppercase text-[10px] tracking-widest">{status || 'Pending'}</Badge>;
    }
  };

  const handleQuickAction = async (order: any) => {
    try {
      if (order.moderation_status === 'pending_moderation') {
        navigate('/admin/rfqs');
        return;
      } else if (order.vendor_status === 'cancel_requested') {
        navigate(`/admin/orders/${order.id}`);
        return;
      }
      fetchOrders(true);
    } catch (err: any) {
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    }
  };

  const renderTimeline = (order: any) => {
    const steps = [
      { label: 'Order Placed', status: 'completed', date: order.created_at },
      { label: 'Admin Forwarded', status: order.moderation_status !== 'pending_moderation' ? 'completed' : 'pending', date: null },
      { label: 'Vendor Accepted', status: order.status !== 'ordered' && order.status !== 'pending' ? 'completed' : 'pending', date: null },
      { label: 'Shipped', status: order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed' ? 'completed' : 'pending', date: order.shipping_details?.shippedAt },
      { label: 'Delivered', status: order.status === 'delivered' || order.status === 'completed' ? 'completed' : 'pending', date: order.shipping_details?.deliveredAt },
    ];

    return (
      <div className="space-y-4 mt-6 pt-6 border-t border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment Journey</h4>
        <div className="relative pl-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 mb-4 last:mb-0 relative">
              {idx !== steps.length - 1 && (
                <div className={cn(
                  "absolute left-[9px] top-6 w-[2px] h-[calc(100%-8px)]",
                  step.status === 'completed' ? "bg-primary/30" : "bg-slate-100"
                )} />
              )}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                step.status === 'completed' ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-300"
              )}>
                {step.status === 'completed' ? <CheckCircle className="h-3 w-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <div className="flex-1 -mt-0.5">
                <p className={cn("text-xs font-bold uppercase tracking-tight", step.status === 'completed' ? "text-slate-900" : "text-slate-400")}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[9px] font-medium text-slate-400">
                    {new Date(step.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Marketplace Orders
            {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-muted-foreground">Manage all direct sales and fulfilled RFQs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.status === 'pending').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Conf.</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-500/5 border-indigo-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.status === 'confirmed' || o.status === 'shipped').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">In Fulfillment</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.status === 'delivered').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Orders/Buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Moderation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderation</SelectItem>
                  <SelectItem value="pending_moderation">Awaiting Review</SelectItem>
                  <SelectItem value="forwarded">Forwarded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stakeholders</TableHead>
                <TableHead>Moderation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No orders found matching criteria.
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">ORD-{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="font-medium truncate">{order.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                  </TableCell>
                   <TableCell>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">B: {order.buyer_name || 'Client'}</p>
                      <p className="text-slate-500">V: {order.vendor_business_name || 'Supplier'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-black uppercase tracking-tighter",
                      order.moderation_status === 'pending_moderation' ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
                    )}>
                      {order.moderation_status === 'pending_moderation' ? 'Review Needed' : 'Processed'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="ghost" className="text-[10px] font-bold uppercase text-slate-400">
                      {order.is_direct_order ? 'Direct' : 'RFQ Inquiry'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black">{formatPrice(order.target_price * order.quantity)}</TableCell>
                  <TableCell>{getStatusBadge(order)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {order.moderation_status === 'pending_moderation' ? (
                        <Button 
                          size="sm"
                          className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-primary/20 h-8 rounded-lg"
                          onClick={() => handleQuickAction(order)}
                        >
                          <ArrowRight className="h-3 w-3 mr-1.5" />
                          Forward
                        </Button>
                      ) : order.vendor_status === 'cancel_requested' ? (
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="font-black text-[10px] uppercase tracking-widest px-4 h-8 rounded-lg"
                          onClick={() => handleQuickAction(order)}
                        >
                          <AlertCircle className="h-3 w-3 mr-1.5" />
                          Review
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-tight">On Track</span>
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="font-bold h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
