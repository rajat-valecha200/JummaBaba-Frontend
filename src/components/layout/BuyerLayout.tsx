import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  ClipboardList,
  MessageSquare,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const buyerNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/buyer/dashboard' },
  { icon: ShoppingCart, label: 'Cart', path: '/buyer/cart' },
  { icon: Heart, label: 'Wishlist', path: '/buyer/wishlist' },
  { icon: ClipboardList, label: 'Orders', path: '/buyer/orders' },
  { icon: FileText, label: 'My RFQs', path: '/buyer/rfqs' },
  { icon: MessageSquare, label: 'Messages', path: '/buyer/messages' },
  { icon: User, label: 'Profile', path: '/buyer/profile' },
  { icon: Settings, label: 'Settings', path: '/buyer/settings' },
];

export function BuyerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="text-xl font-bold text-primary">
          Jumma<span className="text-secondary">baba</span>
        </Link>
        <span className="text-sm text-muted-foreground ml-auto">My Account</span>
      </header>

      <div className="flex">
        {/* Sidebar - Mobile */}
        <div className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={cn(
            'absolute left-0 top-0 bottom-0 w-64 bg-sidebar transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <Link to="/" className="text-xl font-bold text-primary">
                Jumma<span className="text-sidebar-foreground">baba</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {buyerNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors',
                    location.pathname === item.path
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen sticky top-0">
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="text-xl font-bold text-primary">
              Jumma<span className="text-sidebar-foreground">baba</span>
            </Link>
            <p className="text-xs text-sidebar-foreground/70 mt-1">Buyer Account</p>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {buyerNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-colors',
                  location.pathname === item.path
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Link 
              to="/"
              className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
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
    </div>
  );
}
