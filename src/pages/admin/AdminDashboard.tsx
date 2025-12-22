import { Link } from 'react-router-dom';
import { Users, Package, Building, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/b2b/StatsCard';
import { suppliers, products, users, formatPrice } from '@/data/mockData';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={users.length} icon={Users} trend={{ value: 15, isPositive: true }} />
        <StatsCard title="Verified Vendors" value={suppliers.length} icon={Building} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Products Listed" value={products.length} icon={Package} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Platform Revenue" value={formatPrice(12500000)} icon={TrendingUp} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">Pending Vendor Approvals<Badge variant="destructive">5</Badge></CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/vendors">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suppliers.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={s.logo} alt={s.companyName} className="w-10 h-10 rounded-lg object-cover" />
                    <div><p className="font-medium">{s.companyName}</p><p className="text-sm text-muted-foreground">{s.location}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><XCircle className="h-4 w-4" /></Button>
                    <Button size="sm"><CheckCircle className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">Products for Moderation<Badge variant="destructive">12</Badge></CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/products">View All</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div><p className="font-medium truncate max-w-[180px]">{p.name}</p><p className="text-sm text-muted-foreground">Pending review</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><XCircle className="h-4 w-4" /></Button>
                    <Button size="sm"><CheckCircle className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
