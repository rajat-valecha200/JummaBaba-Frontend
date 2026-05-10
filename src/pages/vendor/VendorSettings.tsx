import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Lock, Shield, Loader2, Save, CheckCircle, Clock,
  LogOut, ExternalLink, LifeBuoy, BookOpen, ChevronRight,
  Mail, MessageSquare, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VendorSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const isApproved = user?.status === 'approved';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 8) {
      toast({ title: 'Weak Password', description: 'New password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: 'Mismatch', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword(passwords.current, passwords.new);
      toast({ title: '✅ Password Updated', description: 'Your password has been changed successfully.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const guideItems = [
    { title: 'How to complete your business profile', href: '#' },
    { title: 'Uploading verification documents', href: '#' },
    { title: 'How to add and manage products', href: '#' },
    { title: 'Understanding the RFQ workflow', href: '#' },
    { title: 'Receiving payments and payouts', href: '#' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage security, preferences, and get help</p>
        </div>
        {/* Quick links in header */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="http://localhost:5175" target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Main Website
            </a>
          </Button>
          <Button variant="destructive" size="sm" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile logout */}
      <div className="flex sm:hidden gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Main Website
          </a>
        </Button>
        <Button variant="destructive" size="sm" className="flex-1" onClick={signOut}>
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Logout
        </Button>
      </div>

      {/* --- Verification Status --- */}
      <Card className={cn(
        'border-2',
        isApproved ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20' : 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
      )}>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
              isApproved ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            )}>
              {isApproved ? <CheckCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Account Status</p>
                <Badge className={cn(
                  'text-xs',
                  isApproved
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                )}>
                  {isApproved ? 'Approved' : 'Pending Review'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isApproved
                  ? 'Your account is verified. You can list products and receive orders.'
                  : 'Your documents are under review. You\'ll be notified by email once approved. Usually takes 1–2 business days.'}
              </p>
              {!isApproved && (
                <p className="text-xs text-muted-foreground mt-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                  If it's been more than 48 hours, please contact support below.
                </p>
              )}
            </div>
            <div className="shrink-0">
              <Shield className={cn('h-8 w-8', isApproved ? 'text-blue-400' : 'text-amber-400')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* --- Change Password --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" />Security</h3>
          <p className="text-sm text-muted-foreground mt-1">Update your login password. Use a strong, unique password.</p>
        </div>
        <div className="md:col-span-2">
          <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Password must be at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Your current password"
                      value={passwords.current}
                      onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrent(v => !v)}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={passwords.new}
                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNew(v => !v)}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Repeat new password"
                      value={passwords.confirm}
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      required
                    />
                  </div>
                </div>
                {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Passwords don't match
                  </p>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* --- User Guide --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" />Seller Guide</h3>
          <p className="text-sm text-muted-foreground mt-1">Quick guides to help you get started and grow on JummaBaba.</p>
        </div>
        <div className="md:col-span-2">
          <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
            <CardContent className="pt-5 divide-y">
              {guideItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="flex items-center justify-between py-3 text-sm hover:text-primary transition-colors group"
                >
                  <span>{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* --- Contact Support --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><LifeBuoy className="h-4 w-4" />Support</h3>
          <p className="text-sm text-muted-foreground mt-1">Having trouble? Our team is here to help.</p>
        </div>
        <div className="md:col-span-2 space-y-3">
          <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
            <CardContent className="pt-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href="mailto:support@jummababa.com"
                  className="flex items-center gap-3 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email Support</p>
                    <p className="text-xs text-muted-foreground">support@jummababa.com</p>
                    <p className="text-xs text-muted-foreground">Reply within 24 hrs</p>
                  </div>
                </a>

                <a
                  href="https://wa.me/911234567890"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border hover:border-blue-500 hover:bg-blue-50 transition-all group dark:hover:bg-blue-950/30"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">WhatsApp Support</p>
                    <p className="text-xs text-muted-foreground">+91 12345 67890</p>
                    <p className="text-xs text-muted-foreground">Mon–Sat, 10am–6pm</p>
                  </div>
                </a>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <strong>Account ID:</strong>{' '}
                <code className="font-mono">{user?.id?.slice(0, 8)}...</code>
                {' '}— Please share this with support when contacting us.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* --- Danger Zone --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold text-destructive">Session</h3>
          <p className="text-sm text-muted-foreground mt-1">Sign out of your vendor account.</p>
        </div>
        <div className="md:col-span-2">
          <Card className="border-destructive/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Signed in as</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">Role: {user?.role}</p>
                </div>
                <Button variant="destructive" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
