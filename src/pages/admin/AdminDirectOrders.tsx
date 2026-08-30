import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

// Direct Orders have their own lifecycle (direct_order_status), kept deliberately separate from
// the classic moderation queue — AdminRfqs.tsx explicitly excludes is_direct_order rows, and they
// only show up in Marketplace Orders once payment is confirmed. Before that, admin's only
// visibility was Messages (reachable only by knowing/guessing which RFQ to open) — no persistent,
// scannable list of every Direct Order and where it stands. This page is that list, with a link
// straight into the chat card where the actual review/forward action lives (this page itself is
// read-only/navigational). Styled to match AdminOrders.tsx's admin-portal look.
const ORDER_LIFECYCLE_STATUSES = ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'];

function getStatusBadge(r: any) {
  if (ORDER_LIFECYCLE_STATUSES.includes(r.status)) {
    const labels: Record<string, string> = {
      ordered: 'Order Placed', confirmed: 'Confirmed', shipped: 'Shipped',
      delivered: 'Delivered', completed: 'Completed'
    };
    return { label: labels[r.status] || 'Order Placed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  }
  if (r.status === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
  }
  switch (r.direct_order_status) {
    case 'seller_declined':
      return { label: 'Declined by Seller', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    case 'pending_review':
      return { label: 'Action Needed — Review', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    case 'pending_seller_accept':
      return { label: 'Awaiting Seller', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    case 'seller_accepted':
      return { label: 'Awaiting Buyer Payment', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
    default:
      return { label: 'Processing', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  }
}

export default function AdminDirectOrders() {
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

  const filtered = useMemo(() => {
    return orders.filter((r) => {
      const matchesSearch = !search ||
        r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.vendor_business_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'action_needed' && r.direct_order_status === 'pending_review') ||
        (statusFilter === 'placed' && ORDER_LIFECYCLE_STATUSES.includes(r.status)) ||
        (statusFilter === 'declined' && r.direct_order_status === 'seller_declined');
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Direct Orders</h1>
          <p className="text-muted-foreground">All Buy Now orders across the marketplace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.direct_order_status === 'pending_review').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-500/5 border-indigo-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.direct_order_status === 'pending_seller_accept').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Seller</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => ORDER_LIFECYCLE_STATUSES.includes(o.status)).length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Orders Placed</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-500/5 border-zinc-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-black">{orders.filter(o => o.direct_order_status === 'seller_declined').length}</div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Declined</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, buyer, or seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl border-slate-200 bg-white">
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Fixed Price/Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No Direct Orders found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const badge = getStatusBadge(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{r.product_name}</TableCell>
                      <TableCell>{r.buyer_name || '—'}</TableCell>
                      <TableCell>{r.vendor_business_name || '—'}</TableCell>
                      <TableCell>{r.quantity} {r.unit}</TableCell>
                      <TableCell className="font-medium">₹{Number(r.target_price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ORDER_LIFECYCLE_STATUSES.includes(r.status) && (
                            <Link to={`/admin/orders/${r.id}`}>
                              <Button size="sm" variant="ghost">
                                Order <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </Link>
                          )}
                          <Link to={`/admin/messages?chatGroupId=${r.order_group_id || r.negotiation_group_id || ''}&rfqId=${r.id}`}>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
