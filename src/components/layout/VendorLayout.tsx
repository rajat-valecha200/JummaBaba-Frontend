import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare, Building, Settings, Menu, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
const vendorNavItems = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  path: '/vendor/dashboard'
}, {
  icon: Package,
  label: 'Products',
  path: '/vendor/products'
}, {
  icon: ShoppingCart,
  label: 'Orders',
  path: '/vendor/orders'
}, {
  icon: FileText,
  label: 'RFQs',
  path: '/vendor/rfqs'
}, {
  icon: MessageSquare,
  label: 'Messages',
  path: '/vendor/messages'
}, {
  icon: Building,
  label: 'Business Profile',
  path: '/vendor/profile'
}, {
  icon: Settings,
  label: 'Settings',
  path: '/vendor/settings'
}];
export function VendorLayout() {
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
        <span className="text-sm text-muted-foreground ml-auto">Vendor Panel</span>
      </header>

      <div className="flex">
        {/* Sidebar - Mobile */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={cn('absolute left-0 top-0 bottom-0 w-64 bg-sidebar transition-transform', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <Link to="/" className="text-xl font-bold text-primary">
                Jumma<span className="text-sidebar-foreground">baba</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {vendorNavItems.map(item => <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>)}
            </nav>
          </aside>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen sticky top-0">
          <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="text-xl font-bold">
              <span className="text-b2b-black"><span className="font-extrabold">J</span>umma</span>
              <span className="text-b2b-black"><span className="font-extrabold text-blue-600">B</span>aba</span>
              <span className="text-b2b-orange">.com</span>
            </Link>
            <p className="text-xs text-sidebar-foreground/70 mt-1">Vendor Dashboard</p>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {vendorNavItems.map(item => <Link key={item.path} to={item.path} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
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