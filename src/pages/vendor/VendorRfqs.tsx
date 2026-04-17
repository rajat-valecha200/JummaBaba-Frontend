import { useState } from 'react';
import { Eye, Search, Filter, MessageSquare, Clock, CheckCircle, Send, Info, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Extended RFQ status flow
type RfqStatus = 'pending' | 'quoted' | 'admin_approved' | 'sent_to_buyer' | 'closed';

interface RfqResponse {
  price: number;
  deliveryDays: number;
  message: string;
  respondedAt: string;
}

interface Rfq {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice: number | null;
  deliveryLocation: string;
  description: string;
  status: RfqStatus;
  createdAt: string;
  response?: RfqResponse;
}

// Use database-driven RFQs

export default function VendorRfqs() {
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const data = await api.rfqs.list();
        setRfqs(data.map((r: any) => ({
          ...r,
          productName: r.product_name || r.productName,
          buyerName: r.buyer_name || r.buyerName || 'Client',
          buyerEmail: r.buyer_email || r.buyerEmail || 'client@jummbababa.com',
          createdAt: r.created_at,
          targetPrice: r.target_price
        })));
      } catch (err) {
        console.error('RFQ fetch failed');
      } finally {
        setLoading(false);
      }
    };
    fetchRfqs();
  }, []);

  const filteredRfqs = rfqs.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenResponse = (rfq: Rfq) => {
    setSelectedRfq(rfq);
    setResponseForm({
      price: rfq.targetPrice || 0,
      deliveryDays: 7,
      message: '',
    });
    setResponseOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedRfq) return;
    
    if (responseForm.price <= 0) {
      toast({ title: 'Please enter a valid price', variant: 'destructive' });
      return;
    }
    if (!responseForm.message.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }

    setRfqs(rfqs.map(r => 
      r.id === selectedRfq.id 
        ? {
            ...r,
            status: 'quoted' as RfqStatus,
            response: {
              price: responseForm.price,
              deliveryDays: responseForm.deliveryDays,
              message: responseForm.message,
              respondedAt: new Date().toISOString(),
            },
          }
        : r
    ));

    toast({ title: 'Quote submitted! Awaiting admin approval before being sent to buyer.' });
    setResponseOpen(false);
    setSelectedRfq(null);
  };

  const getStatusBadge = (status: RfqStatus) => {
    switch (status) {
      case 'quoted':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-warning/10 text-warning border-warning/20 cursor-help">
                <Clock className="h-3 w-3 mr-1" />
                Waiting Approval
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Your quote will be shared with the buyer after admin approval.
            </TooltipContent>
          </Tooltip>
        );
      case 'admin_approved':
        return <Badge className="bg-secondary/10 text-secondary border-secondary/20"><CheckCircle className="h-3 w-3 mr-1" />Admin Approved</Badge>;
      case 'sent_to_buyer':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Sent to Buyer</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const pendingCount = rfqs.filter(r => r.status === 'pending').length;
  const quotedCount = rfqs.filter(r => r.status === 'quoted').length;
  const approvedCount = rfqs.filter(r => r.status === 'admin_approved' || r.status === 'sent_to_buyer').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RFQ Management</h1>
        <p className="text-muted-foreground">Respond to buyer inquiries and send quotes</p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center gap-1">
          Your quotes will be shared with buyers after admin approval.
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              JummaBaba Support reviews all quotes before sending to buyers to ensure quality and fair pricing.
            </TooltipContent>
          </Tooltip>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{rfqs.length}</div>
                <p className="text-sm text-muted-foreground">Total RFQs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-sm text-muted-foreground">Awaiting Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{quotedCount}</div>
                <p className="text-sm text-muted-foreground">Waiting Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{approvedCount}</div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              Incoming RFQs
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} new</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
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
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell>
                    <p className="font-medium truncate max-w-[180px]">{rfq.productName}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rfq.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{rfq.buyerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                  <TableCell>
                    {rfq.targetPrice ? formatPrice(rfq.targetPrice) : <span className="text-muted-foreground">Not specified</span>}
                  </TableCell>
                  <TableCell>{rfq.deliveryLocation}</TableCell>
                  <TableCell>{getStatusBadge(rfq.status)}</TableCell>
                  <TableCell>{new Date(rfq.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {rfq.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOpenResponse(rfq)}>
                          <Send className="h-4 w-4 mr-1" />
                          Quote
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRfqs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No RFQs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFQ Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>RFQ Details</DialogTitle>
            <DialogDescription>Buyer inquiry details</DialogDescription>
          </DialogHeader>
          {selectedRfq && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedRfq.status)}
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedRfq.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <h4 className="font-medium mb-2">Product Required</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{selectedRfq.productName}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Qty: <strong>{selectedRfq.quantity} {selectedRfq.unit}</strong></span>
                    {selectedRfq.targetPrice && (
                      <span>Target: <strong>{formatPrice(selectedRfq.targetPrice)}/{selectedRfq.unit}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  {selectedRfq.description}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Buyer Information</h4>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="font-medium">{selectedRfq.buyerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRfq.buyerEmail}</p>
                  <p className="text-sm text-muted-foreground">{selectedRfq.buyerPhone}</p>
                  <p className="text-sm text-muted-foreground">📍 {selectedRfq.deliveryLocation}</p>
                </div>
              </div>

              {selectedRfq.response && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 text-success">Your Response</h4>
                    <div className="p-3 bg-success/5 border border-success/20 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quoted Price:</span>
                        <strong>{formatPrice(selectedRfq.response.price)}/{selectedRfq.unit}</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Time:</span>
                        <strong>{selectedRfq.response.deliveryDays} days</strong>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{selectedRfq.response.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Responded on {new Date(selectedRfq.response.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedRfq?.status === 'pending' && (
              <Button onClick={() => { setDetailsOpen(false); handleOpenResponse(selectedRfq); }}>
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Respond to {selectedRfq?.buyerName}'s inquiry for {selectedRfq?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p><strong>Requested:</strong> {selectedRfq?.quantity} {selectedRfq?.unit}</p>
              {selectedRfq?.targetPrice && (
                <p><strong>Target Price:</strong> {formatPrice(selectedRfq.targetPrice)}/{selectedRfq.unit}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Your Price (₹/{selectedRfq?.unit})</Label>
                <Input
                  id="price"
                  type="number"
                  value={responseForm.price}
                  onChange={(e) => setResponseForm({ ...responseForm, price: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="delivery">Delivery Days</Label>
                <Input
                  id="delivery"
                  type="number"
                  value={responseForm.deliveryDays}
                  onChange={(e) => setResponseForm({ ...responseForm, deliveryDays: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message to Buyer</Label>
              <Textarea
                id="message"
                value={responseForm.message}
                onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                placeholder="Include details about MOQ, payment terms, shipping, etc."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitResponse}>
              <Send className="h-4 w-4 mr-2" />
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
