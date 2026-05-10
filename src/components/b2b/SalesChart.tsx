import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const data = [
  { name: 'Jan', sales: 4000, leads: 2400 },
  { name: 'Feb', sales: 3000, leads: 1398 },
  { name: 'Mar', sales: 2000, leads: 9800 },
  { name: 'Apr', sales: 2780, leads: 3908 },
  { name: 'May', sales: 1890, leads: 4800 },
  { name: 'Jun', sales: 2390, leads: 3800 },
  { name: 'Jul', sales: 3490, leads: 4300 },
];

interface SalesChartProps {
  title?: string;
  className?: string;
}

export function SalesChart({ title = "Performance Overview", className }: SalesChartProps) {
  return (
    <Card className={cn(
      "border-white/10 bg-black/5 backdrop-blur-md shadow-xl", 
      className
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight text-foreground/90 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontWeight: 'bold'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#f97316" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
