import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ArrowRight, ShoppingCart, Loader2, Clock, Wallet, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

// Direct Orders never show up in the RFQ tab (VendorRfqs.tsx explicitly excludes
// is_direct_order rows — they're not a negotiation) and only show up in the Orders tab once
// payment is confirmed (status flips to 'ordered'). Before that, the ONLY place a seller could
// find a pending Direct Order was buried inside Messages — easy to miss if they don't happen to
// check chat, with no persistent, scannable list of "action needed" items. This page is that
// list: every Direct Order this vendor is or was involved in, at any stage, with a link straight
// into the chat card where the actual Accept/Decline action lives (this page itself is
// read-only/navigational — it doesn't duplicate those actions).
const ORDER_LIFECYCLE_STATUSES = ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'];

function getStatusBadge(r: any) {
  if (ORDER_LIFECYCLE_STATUSES.includes(r.status)) {
    const labels: Record<string, string> = {
      ordered: 'Order Placed', confirmed: 'Confirmed', shipped: 'Shipped',
      delivered: 'Delivered', completed: 'Completed'
    };
    return { label: labels[r.status] || 'Order Placed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black uppercase text-[10px] tracking-widest' };
  }
  if (r.status === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-black uppercase text-[10px] tracking-widest' };
  }
  switch (r.direct_order_status) {
    case 'seller_declined':
      return { label: 'Declined by You', className: 'bg-destructive/10 text-destructive border-destructive/20 font-black uppercase text-[10px] tracking-widest' };
    case 'pending_review':
      return { label: 'Pending Admin Review', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-black uppercase text-[10px] tracking-widest' };
    case 'pending_seller_accept':
      return { label: 'Action Needed — Accept?', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-black uppercase text-[10px] tracking-widest' };
    case 'seller_accepted':
      return { label: 'Awaiting Buyer Payment', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 font-black uppercase text-[10px] tracking-widest' };
    default:
      return { label: 'Processing', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-black uppercase text-[10px] tracking-widest' };
  }
}

export default function VendorDirectOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.rfqs.list();
        setOrders(data.filter((r: any) => r.is_direct_order === true));
      } catch (e) {
        console.error('Failed to fetch direct orders', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const actionNeededCount = orders.filter((r) => r.direct_order_status === 'pending_seller_accept').length;
  const awaitingPaymentCount = orders.filter((r) => r.direct_order_status === 'seller_accepted' && !ORDER_LIFECYCLE_STATUSES.includes(r.status)).length;
  const placedCount = orders.filter((r) => ORDER_LIFECYCLE_STATUSES.includes(r.status)).length;
  const declinedCount = orders.filter((r) => r.direct_order_status === 'seller_declined').length;

  const filtered = useMemo(() => {
    return orders.filter((r) => {
      const matchesSearch = !search ||
        r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.buyer_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'action_needed' && r.direct_order_status === 'pending_seller_accept') ||
        (statusFilter === 'placed' && ORDER_LIFECYCLE_STATUSES.includes(r.status)) ||
        (statusFilter === 'declined' && r.direct_order_status === 'seller_declined');
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Direct Orders</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Buy Now orders on your products — fixed price, no negotiation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{actionNeededCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action Needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Wallet className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{awaitingPaymentCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Awaiting Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{placedCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Orders Placed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-500/10 rounded-xl">
                <XCircle className="h-6 w-6 text-zinc-500" />
              </div>
              <div>
                <div className="text-2xl font-black">{declinedCount}</div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative z-10 border-b border-border/50 bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Direct Order Queue</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product or buyer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="action_needed">Action Needed</SelectItem>
                  <SelectItem value="placed">Order Placed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No Direct Orders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Fixed Price/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const badge = getStatusBadge(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{r.product_name}</TableCell>
                      <TableCell className="font-medium">{r.buyer_name || '—'}</TableCell>
                      <TableCell>{r.quantity} {r.unit}</TableCell>
                      <TableCell className="font-medium">₹{Number(r.target_price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ORDER_LIFECYCLE_STATUSES.includes(r.status) && (
                            <Link to={`/vendor/orders?open=${r.id}`}>
                              <Button size="sm" variant="ghost">
                                Order <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </Link>
                          )}
                          <Link to={`/vendor/messages?chatGroupId=${r.order_group_id || r.negotiation_group_id || ''}&rfqId=${r.id}`}>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
