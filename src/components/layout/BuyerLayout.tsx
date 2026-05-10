import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Logo } from '@/components/ui/Logo';

export function BuyerLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    const interval = setInterval(fetchAllNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalNotificationCount = systemNotifications.filter(n => !n.is_read).length + unreadMessages;

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
            <div className="p-4 flex items-start gap-3 hover:bg-muted/50 cursor-pointer" onClick={() => navigate('/buyer/messages')}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Bell className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm font-bold">New Messages</p><p className="text-xs text-muted-foreground mt-0.5">You have {unreadMessages} unread messages.</p></div>
            </div>
          )}
          {systemNotifications.map((notif) => (
            <div key={notif.id} className="p-4 flex items-start gap-3 border-t hover:bg-muted/30 cursor-pointer" onClick={() => api.messages.markSystemAsRead(notif.id)}>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", notif.type === 'success' ? "bg-success/10" : "bg-primary/10")}>
                {notif.type === 'success' ? <CheckCircle className="h-5 w-5 text-success" /> : <Bell className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.content}</p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F1F5F9] flex">
        {/* Mobile Sidebar Overlay */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity bg-black/50', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={() => setSidebarOpen(false)} />
        
        {/* Sidebar */}
        <UnifiedSidebar 
          role="buyer" 
          onClose={() => setSidebarOpen(false)} 
          className={cn('fixed lg:sticky top-0 z-50 w-64 h-screen transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')} 
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Logo size="sm" className="lg:hidden" />
              <div className="hidden lg:block">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Buyer Environment</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
              <div className="flex flex-col items-end hidden sm:flex">
                <p className="text-xs font-black uppercase tracking-wider">{user?.name}</p>
                <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20 uppercase font-bold tracking-widest">Active Buyer</Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}