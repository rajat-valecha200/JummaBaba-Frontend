import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Users, Package, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Logo } from '@/components/ui/Logo';

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const data = await api.stats.get('admin');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const location = useLocation();
  const isMessagesPage = location.pathname.endsWith('/messages');

  const pendingVendors = stats?.pendingVendors || 0;
  const pendingProducts = stats?.pendingProducts || 0;
  const unreadMessages = stats?.unreadMessages || 0;
  const totalCount = pendingVendors + pendingProducts + unreadMessages;

  const NotificationBell = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold" variant="destructive">
              {totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-slate-200">
        <div className="p-4 bg-destructive/5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-destructive">Admin Action Center</p>
          {totalCount > 0 ? (
            <Badge variant="destructive" className="h-5 text-[10px] font-bold">{totalCount} Pending</Badge>
          ) : (
            <Badge variant="outline" className="h-5 text-[10px] font-bold text-emerald-600 border-emerald-200">All Clear ✓</Badge>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {pendingVendors > 0 && (
            <div 
              className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/vendors')}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">Vendor Applications</p>
                <p className="text-[11px] text-slate-500 font-medium">{pendingVendors} seller accounts awaiting verification.</p>
              </div>
            </div>
          )}

          {pendingProducts > 0 && (
            <div 
              className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/products')}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">Product Listings</p>
                <p className="text-[11px] text-slate-500 font-medium">{pendingProducts} new listings pending moderation.</p>
              </div>
            </div>
          )}

          {unreadMessages > 0 && (
            <div 
              className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/messages')}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">Sourcing Messages</p>
                <p className="text-[11px] text-slate-500 font-medium">{unreadMessages} unread messages in negotiation chat.</p>
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No Pending Admin Tasks</p>
              <p className="text-[11px] text-slate-400">All vendor profiles, listings, and messages are up to date.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity bg-black/50', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={() => setSidebarOpen(false)} />
        
        {/* Sidebar */}
        <UnifiedSidebar 
          role="admin" 
          onClose={() => setSidebarOpen(false)} 
          className={cn('fixed lg:sticky top-0 z-50 w-64 h-screen transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')} 
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Logo size="sm" className="lg:hidden" />
              <div className="hidden lg:block">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Administrative Control</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
              <div className="flex flex-col items-end hidden sm:flex">
                <p className="text-xs font-black uppercase tracking-wider">{user?.name}</p>
                <Badge variant="outline" className="text-[10px] h-4 bg-destructive/10 text-destructive border-destructive/20 uppercase font-bold tracking-widest">Super Admin</Badge>
              </div>
            </div>
          </header>

          <main className={cn("flex-1 min-h-0", isMessagesPage ? "overflow-hidden p-0 bg-background" : "overflow-y-auto p-4 lg:p-8")}>
            <div className={cn(isMessagesPage ? "h-full min-h-0" : "max-w-7xl mx-auto")}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}