import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

// Direct Orders never show up in the RFQ tab (they're not a negotiation) and only show up in
// the Orders tab once payment is confirmed (status flips to 'ordered'). Before that, the only
// place a buyer could track a just-placed Direct Order was Messages — no persistent, scannable
// list of "is my order accepted yet / do I need to pay" status. This page is that list, with a
// link straight into the chat card where the actual pay/confirm action lives (this page itself
// is read-only/navigational). Styled to match BuyerOrders.tsx's plainer buyer-portal look.
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
  if (r.negotiation_step === 'payment_pending') {
    return { label: 'Action Needed — Payment', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  }
  switch (r.direct_order_status) {
    case 'seller_declined':
      return { label: 'Declined by Seller', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    case 'pending_review':
      return { label: 'Pending Admin Review', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    case 'pending_seller_accept':
      return { label: 'Awaiting Seller Acceptance', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    default:
      return { label: 'Processing', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  }
}

export default function BuyerDirectOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'action_needed' && r.negotiation_step === 'payment_pending') ||
        (statusFilter === 'placed' && ORDER_LIFECYCLE_STATUSES.includes(r.status)) ||
        (statusFilter === 'declined' && r.direct_order_status === 'seller_declined');
      return matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Direct Orders</h1>
          <p className="text-muted-foreground">{orders.length} Buy Now order(s) placed</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="action_needed">Action Needed</SelectItem>
              <SelectItem value="placed">Order Placed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">No Direct Orders found. Use "Buy Now" on any product to place one.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const badge = getStatusBadge(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate font-medium">{r.product_name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {r.quantity} {r.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{r.vendor_business_name || '—'}</TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="font-semibold">₹{Number(r.target_price).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {ORDER_LIFECYCLE_STATUSES.includes(r.status) && (
                              <Link to={`/buyer/orders?open=${r.id}`}>
                                <Button size="sm" variant="ghost">
                                  Order <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                              </Link>
                            )}
                            <Link to={`/buyer/messages?chatGroupId=${r.order_group_id || r.negotiation_group_id || ''}&rfqId=${r.id}`}>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
