import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare, Building, Settings, Menu, X, ChevronLeft, LogOut, Bell, Activity, DollarSign, ShieldAlert, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';

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



export function VendorLayout() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  
  // Poll for notifications
  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const [msgNotify, sysNotify] = await Promise.all([
          api.messages.getNotifications(),
          api.messages.getSystemNotifications()
        ]);
        setUnreadMessages(msgNotify.unreadCount);
        setSystemNotifications(sysNotify);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchAllNotifications();
    const interval = setInterval(fetchAllNotifications, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);
  
  const isApproved = user?.status === 'approved';
  const isRejected = user?.status === 'rejected';
  const isPending = user?.status === 'pending';
  
  // Filter nav items
  const allowedNavItems = isApproved 
    ? vendorNavItems 
    : vendorNavItems.filter(item => ['Dashboard', 'Settings', 'Business Profile', 'Messages'].includes(item.label));

  // Combine system notifications and messages
  const unreadSystemCount = systemNotifications.filter(n => !n.is_read).length;
  const totalNotificationCount = unreadSystemCount + unreadMessages;

  const NotificationBell = ({ className }: { className?: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {isClient && totalNotificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold" variant="destructive">
              {totalNotificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-border">
        <div className="p-4 bg-primary/5 border-b flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wider text-primary/70">Notifications</p>
          {isClient && totalNotificationCount > 0 && <Badge variant="secondary" className="h-5">{totalNotificationCount} New</Badge>}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {unreadMessages > 0 && (
            <div 
              className="p-4 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate('/vendor/messages')}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">New Messages</p>
                <p className="text-xs text-muted-foreground mt-0.5">You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''} from support.</p>
              </div>
            </div>
          )}

          {systemNotifications.length > 0 && systemNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "p-4 flex items-start gap-3 border-t hover:bg-muted/30 cursor-pointer transition-colors",
                !notif.is_read && "bg-primary/[0.02]"
              )}
              onClick={async () => {
                if (!notif.is_read) {
                  await api.messages.markSystemAsRead(notif.id);
                  setSystemNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                }
              }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                notif.type === 'success' ? "bg-success/10" : notif.type === 'error' ? "bg-destructive/10" : "bg-primary/10"
              )}>
                {notif.type === 'success' ? <CheckCircle className="h-5 w-5 text-success" /> : 
                 notif.type === 'error' ? <XCircle className="h-5 w-5 text-destructive" /> : 
                 <Bell className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-sm", !notif.is_read ? "font-bold" : "font-medium")}>{notif.title}</p>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.content}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}

          {isRejected && systemNotifications.length === 0 && (
            <div className="p-4 flex items-start gap-3 border-t">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-destructive">Profile Action Needed</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.rejectionReason || 'Your account was not approved. Please check details.'}</p>
              </div>
            </div>
          )}

          {totalNotificationCount === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">All caught up!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );


  const handleLogout = () => { signOut(); navigate('/'); };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="text-xl font-bold text-primary">
            Jumma<span className="text-secondary">baba</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
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
                {isPending && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Your profile is being reviewed. Full access will be granted once approved.
                    </p>
                  </div>
                )}
                {isRejected && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Account Rejected</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {user?.rejectionReason || 'Application rejected. Please check notifications for details.'}
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
          <aside className="hidden lg:flex flex-col w-64 bg-sidebar h-screen sticky top-0 overflow-hidden">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between shrink-0">
              <div>
                <Link to="/" className="text-xl font-bold">
                  <span className="text-b2b-black"><span className="font-extrabold">J</span>umma</span>
                  <span className="text-b2b-black"><span className="font-extrabold text-blue-600">B</span>aba</span>
                  <span className="text-b2b-orange">.com</span>
                </Link>
                <p className="text-xs text-sidebar-foreground/70 mt-1">Vendor Dashboard</p>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell />
              </div>
            </div>
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
              {isPending && (
                <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Account Pending</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your business profile is under moderation. You will receive an email once your account is verified.
                  </p>
                </div>
              )}
              {isRejected && (
                <div className="mb-4 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Account Rejected</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {user?.rejectionReason || 'Application rejected. Please update your profile or contact support.'}
                  </p>
                </div>
              )}
              {allowedNavItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-foreground transition-colors group',
                    location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.label === 'Messages' && unreadMessages > 0 && (
                    <Badge className="h-5 min-w-[20px] flex items-center justify-center bg-primary text-primary-foreground border-none text-[10px] font-bold">
                      {unreadMessages}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-sidebar-border space-y-1 shrink-0">
              <a
                href="http://localhost:5175"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Main Website
              </a>
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Marketplace
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6 min-w-0 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
