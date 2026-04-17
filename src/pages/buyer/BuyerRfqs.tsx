import { Link } from 'react-router-dom';
import { Eye, MessageSquare, Plus } from 'lucide-react';
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
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  responded: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function BuyerRfqs() {
  const [dbRfqs, setDbRfqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/public`);
        if (res.ok) {
          const data = await res.json();
          // Filter for current user's RFQs if backend doesn't handle it
          setDbRfqs(data);
        }
      } catch (e) {
        console.error('RFQs failed fetch');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRfqs();
  }, []);

  if (dbRfqs.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No RFQs Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You haven't posted any requirements yet. Start by posting what your business needs.
        </p>
        <Button asChild>
          <Link to="/post-requirement">
            <Plus className="h-4 w-4 mr-2" />
            New RFQ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My RFQs</h1>
          <p className="text-muted-foreground">Manage your quotation requests</p>
        </div>
        <Button asChild>
          <Link to="/post-requirement">
            <Plus className="h-4 w-4 mr-2" />
            New RFQ
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Target Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dbRfqs.map(rfq => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <p className="font-medium">{rfq.productName}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {rfq.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {rfq.quantity} {rfq.unit}
                    </TableCell>
                    <TableCell>
                      {rfq.targetPrice ? formatPrice(rfq.targetPrice) : '-'}
                    </TableCell>
                    <TableCell>{rfq.deliveryLocation}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[rfq.status]} variant="secondary">
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{rfq.responses.length}</span> quotes
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
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
