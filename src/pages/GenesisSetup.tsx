import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Database, UserPlus, Lock, ArrowRight, Terminal as TerminalIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GenesisSetup() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Initializing Genesis Protocol...', '[SYSTEM] Awaiting Authorization...']);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Rajat123') {
      setIsUnlocked(true);
      addLog('ACCESS GRANTED: Protocol Genesis Unlocked.');
      toast({ title: 'Access Granted', description: 'Genesis setup is now active.' });
    } else {
      toast({ title: 'Access Denied', description: 'Invalid security clearance.', variant: 'destructive' });
      addLog('SECURITY ALERT: Unauthorized access attempt.');
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    
    setIsLoading(true);
    addLog('PROTOCOL RESET: Initiating data wipe...');
    try {
      await api.genesis.reset(password);
      addLog('SUCCESS: Transactional database sanitized.');
      toast({ title: 'Reset Successful', description: 'All transactional data has been wiped.' });
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      toast({ title: 'Reset Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setIsLoading(true);
    addLog('PROTOCOL ADMIN: Provisioning Super Admin...');
    try {
      await api.genesis.createAdmin(password);
      addLog('SUCCESS: Super Admin account established.');
      toast({ title: 'Admin Created', description: 'First Super Admin user has been created.' });
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      toast({ title: 'Creation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
      {/* Background scanline effect */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
      
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="lock"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-md w-full"
          >
            <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                  <ShieldAlert className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tighter">SECURE VAULT</CardTitle>
                <CardDescription className="text-zinc-500">Genesis Protocol Entry Point</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="password"
                      placeholder="Enter Genesis Secret"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border-zinc-800 pl-10 h-12 focus-visible:ring-primary"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest">
                    Unlock Protocol <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-black tracking-tighter italic">PROTOCOL: GENESIS</h1>
              </div>

              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Destructive Actions
                  </CardTitle>
                  <CardDescription>Transactional data management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-black rounded-lg border border-zinc-800">
                    <h3 className="font-bold text-amber-500 mb-1 uppercase text-xs">Reset Database</h3>
                    <p className="text-xs text-zinc-500 mb-4">Wipes Products, RFQs, Orders, and non-admin Users.</p>
                    <Button 
                      variant="destructive" 
                      className="w-full font-black uppercase tracking-widest"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Execute Wipe'}
                    </Button>
                  </div>

                  <div className="p-4 bg-black rounded-lg border border-zinc-800">
                    <h3 className="font-bold text-blue-500 mb-1 uppercase text-xs">Provision Admin</h3>
                    <p className="text-xs text-zinc-500 mb-4">Creates the first Super Admin if none exists.</p>
                    <Button 
                      variant="secondary" 
                      className="w-full font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white border-none"
                      onClick={handleCreateAdmin}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Provisioning...' : 'Create First Admin'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black border-zinc-800 text-amber-500 h-[500px] flex flex-col overflow-hidden shadow-inner">
              <CardHeader className="bg-zinc-900 border-b border-zinc-800 py-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <TerminalIcon className="h-4 w-4" />
                  SYSTEM LOGS
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px]">
                {logs.map((log, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                    {log}
                  </div>
                ))}
                {isLoading && (
                  <div className="animate-pulse">_ EXECUTION IN PROGRESS...</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              CRITICAL AUTHORIZATION REQUIRED
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action is <span className="text-red-500 font-bold uppercase underline">irreversible</span>. 
              Executing this protocol will purge all transactional records (Products, RFQs, Orders) 
              and non-administrative user data from the platform.
              <br /><br />
              Are you absolutely certain you wish to proceed with the Genesis Reset?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white uppercase tracking-widest text-xs">
              Abort Protocol
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white border-none font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              Confirm Wipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
