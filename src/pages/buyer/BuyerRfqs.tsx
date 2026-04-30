import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  responded: 'bg-blue-500/10 text-blue-500',
  ordered: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function BuyerRfqs() {
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchRfqs = async () => {
    try {
      const data = await api.rfqs.list();
      setRfqs(data);
    } catch (e) {
      console.error('RFQs failed fetch');
      toast({ title: 'Error', description: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleAction = async (id: string, action: 'accept_quote' | 'reject_quote' | 'request_cancellation') => {
    try {
      await api.rfqs.buyerAction(id, action);
      toast({ 
        title: action === 'accept_quote' 
          ? 'Order Placed!' 
          : action === 'reject_quote' 
            ? 'Quote Declined' 
            : 'Cancellation Requested',
        description: action === 'accept_quote' 
          ? 'Your order has been sent to the supplier.' 
          : action === 'request_cancellation'
            ? 'Your request has been sent for admin review.'
            : 'The request has been closed.'
      });
      setDetailsOpen(false);
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    }
  };

  const activeRfqs = rfqs.filter(r => r.status !== 'ordered' && r.status !== 'cancelled' && r.status !== 'closed');
  const orders = rfqs.filter(r => r.status === 'ordered');
  const history = rfqs.filter(r => r.status === 'cancelled' || r.status === 'closed');

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
                  <Badge className={statusColors[rfq.status]} variant="secondary">
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
                    <Badge className="bg-success text-white animate-pulse">Quote Ready</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
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
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="active">Active RFQs</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <TabsContent value="active" className="p-0">
            <RfqTable data={activeRfqs} />
          </TabsContent>
          <TabsContent value="orders" className="p-0">
            <RfqTable data={orders} />
          </TabsContent>
          <TabsContent value="history" className="p-0">
            <RfqTable data={history} />
          </TabsContent>
        </Card>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>Review your requirement and supplier responses</DialogDescription>
          </DialogHeader>
          
          {selectedRfq && (
            <div className="space-y-6">
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

              {selectedRfq.moderation_status === 'quote_approved' && selectedRfq.response_details && (
                <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <CheckCircle className="h-6 w-6" /> Approved Supplier Quote
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
                  
                  {selectedRfq.response_details.notes && (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Seller Terms</p>
                      <p className="text-sm italic">"{selectedRfq.response_details.notes}"</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRfq.moderation_status !== 'quote_approved' && (
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

          <DialogFooter className="flex sm:justify-between gap-2">
            <div className="flex gap-2">
              {selectedRfq?.moderation_status === 'quote_approved' && selectedRfq.status === 'responded' && (
                <>
                  <Button variant="outline" className="text-destructive" onClick={() => handleAction(selectedRfq.id, 'reject_quote')}>
                    <XCircle className="h-4 w-4 mr-2" /> Decline
                  </Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => handleAction(selectedRfq.id, 'accept_quote')}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Accept & Order
                  </Button>
                </>
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
            <Button variant="ghost" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
