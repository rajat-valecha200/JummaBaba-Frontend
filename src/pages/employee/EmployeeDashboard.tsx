import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Loader2, MessageCircle, Award, Lock, Store, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/b2b/StatsCard';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    api.employees
      .summary()
      .then(setSummary)
      .catch((err) => toast({ title: 'Could not load dashboard', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!summary) return <p className="text-muted-foreground">Could not load your dashboard. Please refresh.</p>;

  const origin = window.location.origin;
  const code = summary.referral_code;
  const sellerLink = `${origin}/vendor/register?ref=${code}`;
  const buyerLink = `${origin}/register?ref=${code}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };
  const whatsapp = (link: string, who: string) => {
    const text = `Join JummaBaba.com, India's B2B wholesale marketplace, as a ${who}: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const w = summary.wallet;
  const tasksFor = (type: string) => (summary.tasks || []).filter((t: any) => t.user_type === type);
  const taskNote = (t: any) => [
    t.max_count !== null && t.max_count !== undefined && `up to ${t.max_count} sales`,
    t.window_days && `within ${t.window_days} days of joining`,
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {summary.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Bring sellers and buyers to JummaBaba and earn points at every milestone.</p>
      </div>

      {summary.profile_status && !summary.profile_status.complete && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-bold">Complete your profile to receive payouts on time</p>
            <p className="text-muted-foreground">We need your bank account and PAN details before we can pay the points you earn.</p>
          </div>
          <Button asChild size="sm"><Link to="/employee/profile">Complete profile</Link></Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Available points" value={w.available_points} subtitle={`≈ ${formatPrice(w.available_amount)} to be paid`} icon={Award} iconClassName="bg-orange-500/10 text-orange-500" />
        <StatsCard title="Blocked points" value={w.blocked_points} subtitle="Waiting for approval / order completion" icon={Lock} iconClassName="bg-amber-500/10 text-amber-500" />
        <StatsCard title="Sellers referred" value={summary.referrals.sellers} subtitle={`${summary.referrals.sellers_approved} approved`} icon={Store} iconClassName="bg-indigo-500/10 text-indigo-500" />
        <StatsCard title="Buyers referred" value={summary.referrals.buyers} icon={ShoppingBag} iconClassName="bg-blue-500/10 text-blue-500" />
      </div>

      {w.mode === 'tiered' && w.next_tier && (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-sm">
          <b>{w.next_tier.points_needed} more points</b> this month and your next points are worth <b>{formatPrice(w.next_tier.next_rate)}</b> each.
        </div>
      )}

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-slate-50/50 px-6 py-4">
          <CardTitle className="text-lg">Your referral code &amp; links</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referral code</p>
              <p className="text-3xl font-black tracking-widest mt-1">{code}</p>
            </div>
            <Button onClick={() => copy(code, 'Code')} variant="outline"><Copy className="h-4 w-4 mr-2" />Copy code</Button>
          </div>
          {[
            { label: 'Seller signup link', link: sellerLink, who: 'seller' },
            { label: 'Buyer signup link', link: buyerLink, who: 'buyer' },
          ].map((row) => (
            <div key={row.label} className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <code className="flex-1 min-w-0 truncate text-xs bg-muted rounded-lg px-3 py-2.5">{row.link}</code>
                <Button size="sm" variant="outline" onClick={() => copy(row.link, 'Link')}><Copy className="h-4 w-4 mr-1.5" />Copy</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => whatsapp(row.link, row.who)}>
                  <MessageCircle className="h-4 w-4 mr-1.5" />WhatsApp
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Whoever signs up through your link is tagged to you automatically — the code is filled in for them.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg">How you earn points</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            {[{ type: 'seller', title: 'Referred sellers' }, { type: 'buyer', title: 'Referred buyers' }].map((g) => tasksFor(g.type).length > 0 && (
              <div key={g.type}>
                <p className="font-bold mb-2">{g.title}</p>
                <ul className="space-y-2">
                  {tasksFor(g.type).map((t: any) => (
                    <li key={t.id} className="flex justify-between gap-3">
                      <span>
                        {t.label}
                        <span className="block text-xs text-muted-foreground">
                          Released on: {t.release_label.toLowerCase()}{taskNote(t) ? ` · ${taskNote(t)}` : ''}
                        </span>
                      </span>
                      <b className="shrink-0">+{t.points}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Points appear as blocked straight away and become available once their condition is met. A rejected profile or product keeps its points blocked, with the reason shown, so a fix can still earn them.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg">Next steps</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Link to="/employee/referrals" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div>
                <p className="font-bold text-sm">Track your referrals</p>
                <p className="text-xs text-muted-foreground">See who's stuck where, and message them the next step</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/employee/leads" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div>
                <p className="font-bold text-sm">Manage your leads</p>
                <p className="text-xs text-muted-foreground">{summary.leads.total} added · {summary.leads.registered} registered</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/employee/points" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div>
                <p className="font-bold text-sm">Points &amp; payouts</p>
                <p className="text-xs text-muted-foreground">Available, blocked &amp; paid points</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
