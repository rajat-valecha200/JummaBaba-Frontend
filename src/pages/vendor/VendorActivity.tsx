import { Activity, Package, FileText, Truck, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  type: 'product_approved' | 'product_rejected' | 'quote_approved' | 'order_shipped' | 'admin_message' | 'rfq_received' | 'order_received';
  title: string;
  description: string;
  timestamp: string;
  date: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'product_approved',
    title: 'Product Approved',
    description: 'Your product "Samsung Galaxy A54 5G Bulk Pack" has been approved by admin.',
    timestamp: '2 hours ago',
    date: '2024-01-20',
  },
  {
    id: 'act-2',
    type: 'quote_approved',
    title: 'Quote Approved',
    description: 'Your quote for RFQ #RFQ-2024-003 (Safety Helmets) has been approved and sent to buyer.',
    timestamp: '5 hours ago',
    date: '2024-01-20',
  },
  {
    id: 'act-3',
    type: 'order_shipped',
    title: 'Order Shipped',
    description: 'Order #JB-2024-003 has been marked as shipped. Tracking: BD123456789IN',
    timestamp: 'Yesterday',
    date: '2024-01-19',
  },
  {
    id: 'act-4',
    type: 'admin_message',
    title: 'Admin Message Received',
    description: 'JummaBaba Support sent you a message regarding order #JB-2024-002.',
    timestamp: 'Yesterday',
    date: '2024-01-19',
  },
  {
    id: 'act-5',
    type: 'rfq_received',
    title: 'New RFQ Received',
    description: 'New RFQ for "Wireless Bluetooth Earbuds" - 500 pieces from Amit Patel.',
    timestamp: '2 days ago',
    date: '2024-01-18',
  },
  {
    id: 'act-6',
    type: 'order_received',
    title: 'New Order Received',
    description: 'Order #JB-2024-002 received from Priya Sharma worth ₹3,39,000.',
    timestamp: '3 days ago',
    date: '2024-01-17',
  },
  {
    id: 'act-7',
    type: 'product_rejected',
    title: 'Product Needs Revision',
    description: 'Your product "Low Quality Item" was rejected. Reason: Insufficient product images.',
    timestamp: '4 days ago',
    date: '2024-01-16',
  },
];

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'product_approved':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'product_rejected':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'quote_approved':
      return <FileText className="h-5 w-5 text-primary" />;
    case 'order_shipped':
      return <Truck className="h-5 w-5 text-secondary" />;
    case 'admin_message':
      return <MessageSquare className="h-5 w-5 text-warning" />;
    case 'rfq_received':
      return <FileText className="h-5 w-5 text-accent" />;
    case 'order_received':
      return <Package className="h-5 w-5 text-primary" />;
    default:
      return <Activity className="h-5 w-5 text-muted-foreground" />;
  }
};

const getActivityBadge = (type: ActivityItem['type']) => {
  switch (type) {
    case 'product_approved':
      return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
    case 'product_rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'quote_approved':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Quote Approved</Badge>;
    case 'order_shipped':
      return <Badge className="bg-secondary/10 text-secondary border-secondary/20">Shipped</Badge>;
    case 'admin_message':
      return <Badge className="bg-warning/10 text-warning border-warning/20">Message</Badge>;
    case 'rfq_received':
      return <Badge variant="outline">New RFQ</Badge>;
    case 'order_received':
      return <Badge className="bg-primary/10 text-primary border-primary/20">New Order</Badge>;
    default:
      return null;
  }
};

export default function VendorActivity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">View your recent account activities and updates</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mockActivities.length}</div>
            <p className="text-sm text-muted-foreground">Total Activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {mockActivities.filter(a => a.type === 'product_approved' || a.type === 'quote_approved').length}
            </div>
            <p className="text-sm text-muted-foreground">Approvals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {mockActivities.filter(a => a.type === 'order_received' || a.type === 'rfq_received').length}
            </div>
            <p className="text-sm text-muted-foreground">New Orders/RFQs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {mockActivities.filter(a => a.type === 'admin_message').length}
            </div>
            <p className="text-sm text-muted-foreground">Admin Messages</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>A chronological record of actions on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {mockActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      </div>
                      {getActivityBadge(activity.type)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
