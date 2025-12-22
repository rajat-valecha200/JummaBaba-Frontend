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
import { rfqs, formatPrice } from '@/data/mockData';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  responded: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function BuyerRfqs() {
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
                {rfqs.map(rfq => (
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
