import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Hammer, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Use the public endpoint to avoid 403 errors for non-admins
        const status = await api.messages.getMaintenanceStatus().catch(() => ({ maintenance_mode: false }));
        setIsMaintenance(status?.maintenance_mode === true);
      } catch (err) {
        // Fallback for any other errors
        console.warn('Maintenance check skipped or failed', err);
        setIsMaintenance(false);
      } finally {
        setLoading(false);
      }
    };

    // Only check if not an admin (admins should always see the site to fix it)
    if (user?.role !== 'admin') {
      checkMaintenance();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return null;

  if (isMaintenance && user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>
        
        <div className="relative z-10 max-w-lg w-full p-12 text-center space-y-8 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl mx-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Hammer className="h-10 w-10 text-primary animate-bounce" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">System Upgrade in Progress</h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              We're currently hardening the marketplace infrastructure to serve you better. We'll be back online shortly.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">Scheduled Stabilization Phase</span>
          </div>

          <div className="pt-4 flex flex-col gap-3">
             <Button 
               variant="outline" 
               className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase tracking-widest hover:bg-white/10"
               onClick={() => window.location.reload()}
             >
               Retry Connection
             </Button>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Support: help@jummababa.com
             </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
