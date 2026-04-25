import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Building, Settings, BarChart3, Shield, Menu, X, ChevronLeft, Bell, MessageSquare, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
export function AdminLayout() {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.get('admin');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats for sidebar:', error);
      }
    };
    fetchStats();
    
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
      badge: null
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: '/admin/messages',
      badge: null
    },
    {
      icon: ShoppingCart,
      label: 'Orders & RFQs',
      path: '/admin/rfqs',
      badge: null
    },
    {
      icon: Building,
      label: 'Vendor Approvals',
      path: '/admin/vendors',
      badge: stats?.pendingVendors || null
    },
    {
      icon: Package,
      label: 'Product Moderation',
      path: '/admin/products',
      badge: stats?.pendingProducts || null
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/admin/users',
      badge: null
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/admin/analytics',
      badge: null
    },
    {
      icon: Shield,
      label: 'Commissions',
      path: '/admin/commissions',
      badge: null
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
      badge: null
    }
  ];

  return <div className="min-h-screen bg-muted/30 font-inter">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="text-xl font-bold">
          <span className="text-b2b-black">Jumma</span>
          <span className="text-blue-600">Baba</span>
          <span className="text-b2b-orange">.com</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {stats?.pendingVendors + stats?.pendingProducts > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs rounded-full">
              {stats.pendingVendors + stats.pendingProducts}
            </Badge>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Mobile */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={cn('absolute left-0 top-0 bottom-0 w-64 bg-sidebar transition-transform', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <Link to="/" className="text-xl font-bold">
                <span className="text-b2b-black">Jumma</span>
                <span className="text-blue-600">Baba</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {adminNavItems.map(item => <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                  <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge ? <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge> : null}
                </Link>)}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-auto"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </aside>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen sticky top-0 border-r border-sidebar-border">
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="text-xl font-bold">
              <span className="text-b2b-black">Jumma</span>
              <span className="text-blue-600">Baba</span>
              <span className="text-b2b-orange">.com</span>
            </Link>
            <div className="mt-1">
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin Control</span>
            </div>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {adminNavItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-all duration-200', 
                  location.pathname === item.path 
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-sm font-semibold' 
                    : 'hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/40")} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge ? (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-in zoom-in-50">
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            ))}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 mt-2"
            >
              <LogOut className="h-5 w-5 text-sidebar-foreground/40" />
              <span className="flex-1 font-medium text-left">Logout</span>
            </button>
          </nav>
          <div className="p-6 border-t border-sidebar-border">
            <button 
              onClick={() => signOut()}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Exit Admin Panel
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>;
}