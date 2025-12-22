import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, IndianRupee, Package } from 'lucide-react';
import { formatPrice, formatNumber } from '@/data/mockData';

const revenueData = [
  { month: 'Jan', revenue: 4500000, orders: 120 },
  { month: 'Feb', revenue: 5200000, orders: 145 },
  { month: 'Mar', revenue: 4800000, orders: 132 },
  { month: 'Apr', revenue: 6100000, orders: 168 },
  { month: 'May', revenue: 7200000, orders: 195 },
  { month: 'Jun', revenue: 6800000, orders: 182 },
  { month: 'Jul', revenue: 8500000, orders: 228 },
  { month: 'Aug', revenue: 9200000, orders: 245 },
  { month: 'Sep', revenue: 8800000, orders: 238 },
  { month: 'Oct', revenue: 10500000, orders: 285 },
  { month: 'Nov', revenue: 11200000, orders: 302 },
  { month: 'Dec', revenue: 12500000, orders: 340 },
];

const userGrowthData = [
  { month: 'Jan', buyers: 850, vendors: 45 },
  { month: 'Feb', buyers: 920, vendors: 52 },
  { month: 'Mar', buyers: 1050, vendors: 58 },
  { month: 'Apr', buyers: 1180, vendors: 65 },
  { month: 'May', buyers: 1350, vendors: 72 },
  { month: 'Jun', buyers: 1520, vendors: 80 },
  { month: 'Jul', buyers: 1720, vendors: 88 },
  { month: 'Aug', buyers: 1950, vendors: 95 },
  { month: 'Sep', buyers: 2150, vendors: 102 },
  { month: 'Oct', buyers: 2380, vendors: 112 },
  { month: 'Nov', buyers: 2650, vendors: 125 },
  { month: 'Dec', buyers: 2950, vendors: 138 },
];

const categoryRevenue = [
  { name: 'Electronics', value: 35 },
  { name: 'Textiles', value: 25 },
  { name: 'Industrial', value: 18 },
  { name: 'Food & Agri', value: 12 },
  { name: 'Others', value: 10 },
];

const orderStatusData = [
  { status: 'Delivered', count: 1250, color: 'hsl(var(--success))' },
  { status: 'Shipped', count: 320, color: 'hsl(var(--secondary))' },
  { status: 'Confirmed', count: 180, color: 'hsl(var(--primary))' },
  { status: 'Pending', count: 95, color: 'hsl(var(--warning))' },
  { status: 'Cancelled', count: 45, color: 'hsl(var(--destructive))' },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--muted-foreground))'];

export default function AdminAnalytics() {
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
  const latestUsers = userGrowthData[userGrowthData.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Platform performance metrics and insights</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                <div className="flex items-center gap-1 text-success text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>+18.2% vs last year</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{formatNumber(totalOrders)}</p>
                <div className="flex items-center gap-1 text-success text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>+24.5% vs last year</span>
                </div>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <ShoppingCart className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Buyers</p>
                <p className="text-2xl font-bold">{formatNumber(latestUsers.buyers)}</p>
                <div className="flex items-center gap-1 text-success text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12.8% this month</span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">{latestUsers.vendors}</p>
                <div className="flex items-center gap-1 text-success text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>+10.4% this month</span>
                </div>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Package className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Revenue Overview</span>
            <Badge variant="outline">2024</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  className="text-xs" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="buyers"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Buyers"
                  />
                  <Line
                    type="monotone"
                    dataKey="vendors"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))' }}
                    name="Vendors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Buyers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">Vendors</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    type="category" 
                    dataKey="status" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Orders']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryRevenue.map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm text-muted-foreground">{cat.name} ({cat.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Orders']}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
