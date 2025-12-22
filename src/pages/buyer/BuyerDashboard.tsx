import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { orders, rfqs, formatPrice, formatNumber } from '@/data/mockData';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-secondary/10 text-secondary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  responded: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function BuyerDashboard() {
  const recentOrders = orders.slice(0, 3);
  const recentRfqs = rfqs.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, Amit!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="RFQs Sent"
          value={rfqs.length}
          icon={FileText}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title="Messages"
          value={5}
          icon={MessageSquare}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Total Spent"
          value={formatPrice(3094000)}
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/buyer/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.items[0].productName}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                    <Badge className={statusColors[order.status]} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent RFQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My RFQs</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/buyer/rfqs">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRfqs.map(rfq => (
                <div key={rfq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rfq.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {rfq.quantity} {rfq.unit}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <Badge className={statusColors[rfq.status]} variant="secondary">
                      {rfq.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rfq.responses.length} responses
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/post-requirement">
                <FileText className="h-5 w-5" />
                <span>Post RFQ</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/buyer/cart">
                <ShoppingCart className="h-5 w-5" />
                <span>View Cart</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/products">
                <Package className="h-5 w-5" />
                <span>Browse Products</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/buyer/messages">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
