import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UnifiedSidebar } from './UnifiedSidebar';
import { CelebrationDialog } from '@/components/employee/CelebrationDialog';
import { ProfilePrompt } from '@/components/employee/ProfilePrompt';
import { Logo } from '@/components/ui/Logo';

// Same shell as the vendor/admin portals (sidebar + sticky header + scrolling content), minus the
// notification bell — employees have no marketplace messages or system alerts.
export function EmployeeLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden">
        <div className={cn('fixed inset-0 z-50 lg:hidden transition-opacity bg-black/50', sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={() => setSidebarOpen(false)} />

        <UnifiedSidebar
          role="employee"
          onClose={() => setSidebarOpen(false)}
          className={cn('fixed lg:sticky top-0 z-50 w-64 h-screen transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-sidebar-border h-20 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Logo size="sm" className="lg:hidden" />
              <div className="hidden lg:block">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Growth Partner Portal</h2>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs font-black uppercase tracking-wider">{user?.full_name || 'Employee'}</p>
              <Badge variant="outline" className="text-[10px] h-4 uppercase font-bold">Employee</Badge>
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <CelebrationDialog />
      <ProfilePrompt />
    </TooltipProvider>
  );
}
