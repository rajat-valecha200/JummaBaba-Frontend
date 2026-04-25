import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare, Building, Settings, Menu, X, ChevronLeft, LogOut, Bell, Activity, DollarSign, ShieldAlert } from 'lucide-react';

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
  icon: DollarSign,
  label: 'Payouts',
  path: '/vendor/payouts'
}, {
  icon: Activity,
  label: 'Activity Log',
  path: '/vendor/activity'
}, {
  icon: Settings,
  label: 'Settings',
  path: '/vendor/settings'
}];

// Mock notification counts
const mockNotifications = {
  newRfqs: 3,
  orderUpdates: 2,
  adminMessages: 1,
};

export function VendorLayout() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isApproved = user?.status === 'approved';
  
  // Filter nav items: Only show Settings and Profile if not approved
  const allowedNavItems = isApproved 
    ? vendorNavItems 
    : vendorNavItems.filter(item => ['Settings', 'Business Profile'].includes(item.label));

  const totalNotifications = mockNotifications.newRfqs + mockNotifications.orderUpdates + mockNotifications.adminMessages;

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

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
            {totalNotifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs" variant="destructive">
                {totalNotifications}
              </Badge>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">Vendor Panel</span>
        </div>
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
              {!isApproved && (
                <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 text-warning mb-1">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Pending Approval</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Your profile is being reviewed. Full access will be granted once approved.
                  </p>
                </div>
              )}
              {allowedNavItems.map(item => <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>)}
            </nav>
          </aside>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen sticky top-0">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <div>
              <Link to="/" className="text-xl font-bold">
                <span className="text-b2b-black"><span className="font-extrabold">J</span>umma</span>
                <span className="text-b2b-black"><span className="font-extrabold text-blue-600">B</span>aba</span>
                <span className="text-b2b-orange">.com</span>
              </Link>
              <p className="text-xs text-sidebar-foreground/70 mt-1">Vendor Dashboard</p>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {totalNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs" variant="destructive">
                  {totalNotifications}
                </Badge>
              )}
            </Button>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {!isApproved && (
              <div className="mb-4 p-4 bg-warning/5 border border-warning/10 rounded-xl">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Account Pending</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your business profile is under moderation. You will receive an email once your account is verified.
                </p>
              </div>
            )}
            {allowedNavItems.map(item => <Link key={item.path} to={item.path} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors', location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent')}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>)}
          </nav>
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>;
}
