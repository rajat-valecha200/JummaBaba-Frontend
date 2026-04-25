import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  MoreHorizontal,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from '@/lib/utils';

export default function AdminRfqs() {
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRfqs = async () => {
    try {
      const data = await api.rfqs.list();
      setRfqs(data);
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
      toast({ title: 'Error', description: 'Failed to load RFQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleForward = async (id: string) => {
    try {
      await api.rfqs.forward(id);
      toast({ title: 'Success', description: 'RFQ forwarded to seller' });
      fetchRfqs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'pending_moderation':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending Moderation</Badge>;
      case 'forwarded':
        return <Badge className="bg-success/20 text-success border-success/30">Forwarded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRfqs = rfqs.filter(r => 
    r.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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
          <h1 className="text-2xl font-bold">Orders & RFQs</h1>
          <p className="text-muted-foreground">Moderate and forward buyer requests to sellers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product or buyer name..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
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
                <TableHead>Moderation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRfqs.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={rfq.product_images?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} 
                          className="w-10 h-10 rounded object-cover"
                          alt={rfq.product_name}
                        />
                        <span className="font-medium">{rfq.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rfq.buyer_name}</TableCell>
                    <TableCell>{rfq.quantity} {rfq.unit}</TableCell>
                    <TableCell>{formatPrice(rfq.target_price)}</TableCell>
                    <TableCell>{getModerationBadge(rfq.moderation_status)}</TableCell>
                    <TableCell className="text-right">
                      {rfq.moderation_status === 'pending_moderation' ? (
                        <Button size="sm" onClick={() => handleForward(rfq.id)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Forward to Seller
                        </Button>
                      ) : (
                        <Badge variant="outline">Completed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
