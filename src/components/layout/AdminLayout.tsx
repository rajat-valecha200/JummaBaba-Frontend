import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Building, Settings, BarChart3, Shield, Menu, X, ChevronLeft, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
const adminNavItems = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  path: '/admin',
  badge: null
}, {
  icon: MessageSquare,
  label: 'Messages',
  path: '/admin/messages',
  badge: 8
}, {
  icon: Building,
  label: 'Vendor Approvals',
  path: '/admin/vendors',
  badge: 5
}, {
  icon: Package,
  label: 'Product Moderation',
  path: '/admin/products',
  badge: 12
}, {
  icon: Users,
  label: 'User Management',
  path: '/admin/users',
  badge: null
}, {
  icon: BarChart3,
  label: 'Analytics',
  path: '/admin/analytics',
  badge: null
}, {
  icon: Shield,
  label: 'Commissions',
  path: '/admin/commissions',
  badge: null
}, {
  icon: Settings,
  label: 'Settings',
  path: '/admin/settings',
  badge: null
}];
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  return <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="text-xl font-bold text-primary">
          Jumma<span className="text-secondary">baba</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Mobile */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={cn('absolute left-0 top-0 bottom-0 w-64 bg-sidebar transition-transform', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <div>
                <Link to="/" className="text-xl font-bold text-primary">
                  Jumma<span className="text-sidebar-foreground">baba</span>
                </Link>
                <p className="text-xs text-destructive font-medium">Admin Panel</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {adminNavItems.map(item => <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>}
                </Link>)}
            </nav>
          </aside>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen sticky top-0">
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="text-xl font-bold text-secondary-foreground">
              JummaBaba<span className="text-primary">.com</span>
            </Link>
            <p className="text-xs text-destructive font-medium mt-1">Admin Panel</p>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {adminNavItems.map(item => <Link key={item.path} to={item.path} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>}
              </Link>)}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>;
}