import { Link } from 'react-router-dom';
import { Package, ShoppingCart, FileText, TrendingUp, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { orders, rfqs, products, formatPrice } from '@/data/mockData';

export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Sharma Textiles</p>
        </div>
        <Button asChild>
          <Link to="/vendor/products/new"><Plus className="h-4 w-4 mr-2" />Add Product</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={products.length} icon={Package} trend={{ value: 8, isPositive: true }} />
        <StatsCard title="Orders Received" value={orders.length} icon={ShoppingCart} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="RFQs Received" value={rfqs.length} icon={FileText} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Revenue" value={formatPrice(3500000)} icon={TrendingUp} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/orders">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="font-medium">{order.orderNumber}</p><p className="text-sm text-muted-foreground">{order.items[0].productName}</p></div>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending RFQs</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/vendor/rfqs">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rfqs.slice(0, 3).map(rfq => (
                <div key={rfq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="font-medium">{rfq.productName}</p><p className="text-sm text-muted-foreground">{rfq.quantity} {rfq.unit}</p></div>
                  <Button size="sm">Respond</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
