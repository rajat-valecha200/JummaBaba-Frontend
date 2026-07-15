import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Logo } from '@/components/ui/Logo';

export function AdminLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.get('admin');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const location = useLocation();
  const isMessagesPage = location.pathname === '/admin/messages';

  return (
    <TooltipProvider>
      <div className="h-screen bg-[#F1F5F9] flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity bg-black/50', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={() => setSidebarOpen(false)} />
        
        {/* Sidebar */}
        <UnifiedSidebar 
          role="admin" 
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
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Administrative Control</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {((stats?.pendingVendors || 0) + (stats?.pendingProducts || 0) + (stats?.unreadMessages || 0)) > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold" variant="destructive">
                    {(stats?.pendingVendors || 0) + (stats?.pendingProducts || 0) + (stats?.unreadMessages || 0)}
                  </Badge>
                )}
              </Button>
              <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
              <div className="flex flex-col items-end hidden sm:flex">
                <p className="text-xs font-black uppercase tracking-wider">{user?.name}</p>
                <Badge variant="outline" className="text-[10px] h-4 bg-destructive/10 text-destructive border-destructive/20 uppercase font-bold tracking-widest">Super Admin</Badge>
              </div>
            </div>
          </header>

          <main className={cn("flex-1", isMessagesPage ? "overflow-hidden p-0 bg-background" : "overflow-y-auto p-4 lg:p-8")}>
            <div className={cn(isMessagesPage ? "h-full" : "max-w-7xl mx-auto")}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}