import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  MessageSquare, 
  Building, 
  Settings, 
  X, 
  LogOut, 
  Bell, 
  Activity, 
  DollarSign, 
  ShieldAlert, 
  ExternalLink, 
  ChevronLeft,
  Users,
  BarChart3,
  Globe,
  Heart,
  ListTodo
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarItem {
  icon: any;
  label: string;
  path: string;
  badgeCount?: number;
}

interface UnifiedSidebarProps {
  role: 'admin' | 'vendor' | 'buyer';
  onClose?: () => void;
  className?: string;
}

export function UnifiedSidebar({ role, onClose, className }: UnifiedSidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRfqs, setPendingRfqs] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  
  // Admin-specific moderation notification states
  const [pendingVendors, setPendingVendors] = useState(0);
  const [pendingProducts, setPendingProducts] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [msgNotify, sysNotify, rfqs, orders] = await Promise.all([
          api.messages.getNotifications(),
          api.messages.getSystemNotifications(),
          api.rfqs.list(),
          api.orders.listVendor()
        ]);
        setUnreadMessages(msgNotify.unreadCount);
        setSystemNotifications(sysNotify);
        
        // Count items needing attention
        if (role === 'admin') {
          setPendingRfqs(rfqs.filter((r: any) => !r.is_direct_order && (r.moderation_status === 'pending_moderation' || r.moderation_status === 'quote_pending')).length);
          setActiveOrders(rfqs.filter((r: any) => r.is_direct_order && r.moderation_status === 'pending_moderation').length);
          
          try {
            const [pVendors, pProducts] = await Promise.all([
              api.profiles.list('vendor', 'pending'),
              api.products.list('pending')
            ]);
            setPendingVendors(pVendors.length);
            setPendingProducts(pProducts.length);
          } catch (adminErr) {
            console.error('Failed to load admin stats for sidebar:', adminErr);
          }
        } else if (role === 'vendor') {
          setPendingRfqs(rfqs.filter((r: any) => !r.is_direct_order && (r.vendor_status === 'pending' || r.moderation_status === 'quote_rejected')).length);
          setActiveOrders(orders.filter((o: any) => o.is_direct_order === true || ['pending', 'pending_processing', 'confirmed', 'shipped'].includes(o.vendor_status) || ['ordered', 'confirmed', 'shipped'].includes(o.status)).length);
        } else if (role === 'buyer') {
          setPendingRfqs(rfqs.filter((r: any) => !r.is_direct_order && r.moderation_status === 'quote_approved' && r.status === 'responded').length);
          setActiveOrders(orders.filter((o: any) => o.is_direct_order && (o.status === 'shipped' || o.status === 'ordered')).length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Faster polling for real-time feel
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const adminNav: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: ListTodo, label: 'Categories', path: '/admin/categories' },
    { icon: Users, label: 'Vendors', path: '/admin/vendors', badgeCount: pendingVendors },
    { icon: Package, label: 'Products', path: '/admin/products', badgeCount: pendingProducts },
    { icon: FileText, label: 'RFQ Inquiries', path: '/admin/rfqs', badgeCount: pendingRfqs },
    { icon: ShoppingCart, label: 'Marketplace Orders', path: '/admin/orders', badgeCount: activeOrders },
    { icon: DollarSign, label: 'Commissions', path: '/admin/commissions' },
    { icon: DollarSign, label: 'Earnings Ledger', path: '/admin/earnings' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages', badgeCount: unreadMessages },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const vendorNav: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: Package, label: 'Products', path: '/vendor/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/vendor/orders', badgeCount: activeOrders },
    { icon: FileText, label: 'RFQs', path: '/vendor/rfqs', badgeCount: pendingRfqs },
    { icon: MessageSquare, label: 'Messages', path: '/vendor/messages', badgeCount: unreadMessages },
    { icon: Building, label: 'Business Profile', path: '/vendor/profile' },
    { icon: DollarSign, label: 'Payouts', path: '/vendor/payouts' },
    { icon: DollarSign, label: 'Earnings', path: '/vendor/earnings' },
    { icon: Activity, label: 'Activity Log', path: '/vendor/activity' },
    { icon: Settings, label: 'Settings', path: '/vendor/settings' },
  ];

  const buyerNav: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/buyer/dashboard' },
    { icon: ShoppingCart, label: 'Direct Orders', path: '/buyer/orders' },
    { icon: ListTodo, label: 'Negotiations (RFQ)', path: '/buyer/rfqs', badgeCount: pendingRfqs },
    { icon: Heart, label: 'My Wishlist', path: '/buyer/wishlist' },
    { icon: MessageSquare, label: 'Messages', path: '/buyer/messages', badgeCount: unreadMessages },
    { icon: Users, label: 'Profile', path: '/buyer/profile' },
    { icon: Settings, label: 'Settings', path: '/buyer/settings' },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'vendor' ? vendorNav : buyerNav;

  return (
    <aside className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden", className)}>
      <div className="h-20 px-6 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-white">
        <div>
          <Logo size="md" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1.5 opacity-70">
            {role} PORTAL
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {/* Status Badges for Verification-dependent roles */}
        {(role === 'vendor' || role === 'buyer') && user?.status === 'pending' && (
          <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl animate-pulse">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pending Moderation</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your profile is being verified. Some features are restricted.
            </p>
          </div>
        )}

        {(role === 'vendor' || role === 'buyer') && user?.status === 'rejected' && (
          <div className="mb-4 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Profile Rejected</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              {user.rejection_reason || 'Your profile did not pass review.'} You can't place new orders until this is fixed.
            </p>
            <Link
              to={role === 'vendor' ? '/vendor/profile' : '/buyer/profile'}
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-destructive underline"
            >
              Update Profile →
            </Link>
          </div>
        )}

        {currentNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={cn(
              'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group',
              (item.path === '/admin' || item.path === '/vendor/dashboard' || item.path === '/buyer/dashboard')
                ? (location.pathname === item.path || location.pathname === `${item.path}/`)
                : location.pathname.startsWith(item.path)
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                (item.path === '/admin' || item.path === '/vendor/dashboard' || item.path === '/buyer/dashboard')
                  ? (location.pathname === item.path || location.pathname === `${item.path}/`)
                  : location.pathname.startsWith(item.path) 
                  ? "scale-110 text-white" 
                  : "group-hover:scale-110 text-primary opacity-80"
              )} />
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">{item.label}</span>
            </div>
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <Badge className={cn(
                "h-5 min-w-[20px] rounded-full flex items-center justify-center font-black text-[10px] border-none",
                location.pathname.startsWith(item.path) ? "bg-white text-primary" : "bg-primary text-white"
              )}>
                {item.badgeCount}
              </Badge>
            )}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-sidebar-border bg-muted/20 space-y-2 shrink-0">
        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-white hover:text-primary transition-all duration-200 border border-transparent hover:border-border shadow-sm"
        >
          <Globe className="h-4 w-4" />
          Public Site
        </a>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:bg-destructive/10 px-4 py-2.5 rounded-xl group"
        >
          <LogOut className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-black uppercase tracking-widest">Logout System</span>
        </Button>
      </div>
    </aside>
  );
}
